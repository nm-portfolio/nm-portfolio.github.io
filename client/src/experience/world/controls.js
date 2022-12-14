import _ from 'underscore';
import * as THREE from 'three';
import GSAP from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Experience from '../experience';

export default class Controls {
  constructor() {
    this.experience = new Experience();
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;
    this.time = this.experience.time;
    this.theme = this.experience.world.theme;
    GSAP.registerPlugin(ScrollTrigger);

    this.particles = this.experience.world.particles;
    this.houseView = this.experience.world.houseView;

    this.switchDevice(this.sizes.device);
    this.setObjectScroll();
  }

  setScrollSnaps() {
    this.scrollSnapTrigger = ScrollTrigger.create({
      id: 'scroll-snap',
      snap: {
        snapTo: [0, .035, .08, .245, .52, .73, .98, 1],
        directional: false,
        duration: { min: .2, max: 1.2 },
        ease: 'Power1.easeInOut',
        delay: 0.05
      }
    });
  }

  setHomeScreenAnimations(triggerConfig, showMarkers = false) {
    const menuTl = new GSAP.timeline({ defaults: { ease: 'Power2.inOut', duration: .5 } });
    menuTl
      .to('.menu-item', {
        y: 0,
        opacity: 1,
        stagger: 0.15
      })
      .to('.logo', {
        x: 0,
        opacity: 1
      }, '<')
      .to('.title', {
        y: 0,
        opacity: 1,
        stagger: .2
      }, '<');
    this.homeScreenTrigger = ScrollTrigger.create({
      id: 'home-screen',
      animation: menuTl,
      trigger: triggerConfig.trigger,
      start: triggerConfig.start,
      end: triggerConfig.end,
      markers: showMarkers,
      toggleActions: 'play complete restart none'
    });
  }

  setParticleLineAnimations(triggerConfig, showMarkers = false) {
    const particleTl = new GSAP.timeline();
    particleTl
      .to(this.particles.particleMesh.geometry.attributes.position.array, {
        endArray: () => calculateVertices(this.particles),
        ease: 'power1.inOut',
        duration: 1.5,
        onUpdate: () => {
          this.particles.particleMesh.geometry.attributes.position.needsUpdate = true;
        },
      })
      .to(this.particles.particleMesh.material.color, {
        id: 'particle-line-color',
        r: this.theme === 'light' ? .42 : 1,
        g: this.theme === 'light' ? .42 : 1,
        b: this.theme === 'light' ? .42 : 1,
        ease: 'Power1.easeInOut'
      }, '<');
    ScrollTrigger.create({
      id: 'particle-line',
      animation: particleTl,
      trigger: triggerConfig.trigger,
      start: triggerConfig.start,
      end: triggerConfig.end,
      toggleActions: 'play none reverse none',
      // scrub: 3,
      invalidateOnRefresh: true,
      markers: showMarkers,
      // onEnter: () => {
      //   $('.navbar').addClass('sticky');
      // },
      // onEnterBack: () => {
      //   $('.navbar').removeClass('sticky');
      // }
    });
  }

  setParticleGridScroll() {
    const top = document.body.getBoundingClientRect().top;
    this.particles.particleMesh.position.y = this.particles.y + -top * .075;
    if (window.scrollY > 20) {
      $('.navbar').addClass('sticky');
    } else {
      $('.navbar').removeClass('sticky');
    }
  }

  setObjectScroll() {
    const top = document.body.getBoundingClientRect().top;
    this.houseView.view.position.y = this.houseView.y + -top * .075;
  }

  switchDevice(device) {
    this.setObjectScroll();
    ScrollTrigger.killAll();
    if (device === 'desktop') {
      // this.setScrollSnaps();
      this.setHomeScreenAnimations({
        trigger: '.navbar',
        start: 'top bottom',
        end: 'center top'
      }, false);
      this.setParticleLineAnimations({
        trigger: '.home-title',
        start: '-50px top',
        end: '-50px top'
      }, false);
      document.body.onscroll = () => {
        this.setObjectScroll();
      };
    } else {
      this.setHomeScreenAnimations({
        trigger: undefined,
        start: 'top bottom',
        end: '+=10px top'
      }, false);
      this.setParticleLineAnimations({
        trigger: undefined,
        start: 'top top',
        end: '+=10px'
      }, false);
      document.body.onscroll = () => {
        this.setObjectScroll();
        // this.setParticleGridScroll();
      };
    }
  }

  switchTheme(theme) {
    this.theme = theme;
    let particleST = ScrollTrigger.getById('particle-line');
    let lineColor = this.theme === 'light' ? { r: .42, g: .42, b: .42 } : { r: 1, g: 1, b: 1 }
    Object.assign(particleST.animation.getById('particle-line-color').vars, lineColor);
    particleST.animation.getById('particle-line-color').invalidate();
  }

  resize() { }

  update() { }
}

function calculateVertices(particles) {
  let vertices = [];
  let widthFactor = particles.lineY < 45 ? 2 : 1;
  let lineLength = ((particles.nx * particles.ny) - 1) * (particles.w / widthFactor);
  for (let i = 0; i < particles.nx * particles.ny * 3; i++) {
    if (i % 3 == 0) {
      let lineX = (i / 3) * (particles.w / widthFactor);
      vertices.push([(lineX - particles.x - (lineLength / 2)) / particles.scale]);
    } else if (i % 3 == 1) {
      vertices[~~(i / 3)].push(particles.lineY);
    } else {
      vertices[~~(i / 3)].push(6);
    }
  }
  return new Float32Array(_.flatten(_.shuffle(vertices)));
}
