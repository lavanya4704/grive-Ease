/* ==========================================================================
   Navigation Menu Logic
   ========================================================================== */
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const navItems = document.querySelectorAll('.nav-item');
const navbar = document.querySelector('.navbar');

// Toggle Mobile Menu
navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('open');
  navLinks.classList.toggle('open');
});

// Close Mobile Menu on Link Click
navItems.forEach(item => {
  item.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

// Navbar background change on scroll
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

/* ==========================================================================
   Project Carousel / Slideshow
   ========================================================================== */
const carouselInner = document.getElementById('carouselInner');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dots = document.querySelectorAll('#carouselIndicators .dot');

let currentSlide = 0;
const totalSlides = dots.length;

// Function to slide to specific index
function updateCarousel(index) {
  currentSlide = index;
  // Calculate percentage shift (since total width is 600% for 6 slides, shift is index * 100/6)
  const shiftPercent = currentSlide * (100 / totalSlides);
  carouselInner.style.transform = `translateX(-${shiftPercent}%)`;
  
  // Update indicator dots active class
  dots.forEach(dot => dot.classList.remove('active'));
  dots[currentSlide].classList.add('active');
}

// Next Slide trigger
nextBtn.addEventListener('click', () => {
  const nextIndex = (currentSlide + 1) % totalSlides;
  updateCarousel(nextIndex);
});

// Previous Slide trigger
prevBtn.addEventListener('click', () => {
  const prevIndex = (currentSlide - 1 + totalSlides) % totalSlides;
  updateCarousel(prevIndex);
});

// Indicator Dots Click trigger
dots.forEach(dot => {
  dot.addEventListener('click', (e) => {
    const slideIndex = parseInt(e.target.getAttribute('data-slide'));
    updateCarousel(slideIndex);
  });
});

// Autoplay Carousel Slides
let autoPlayInterval = setInterval(() => {
  const nextIndex = (currentSlide + 1) % totalSlides;
  updateCarousel(nextIndex);
}, 4000);

// Pause Autoplay on Hover
const projectCarousel = document.getElementById('projectCarousel');

projectCarousel.addEventListener('mouseenter', () => {
  clearInterval(autoPlayInterval);
});

projectCarousel.addEventListener('mouseleave', () => {
  autoPlayInterval = setInterval(() => {
    const nextIndex = (currentSlide + 1) % totalSlides;
    updateCarousel(nextIndex);
  }, 4000);
});

/* ==========================================================================
   Modern IntersectionObserver for Scroll Animations
   ========================================================================== */
const revealElements = document.querySelectorAll('.scroll-reveal');

const revealOnScroll = (entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      // Unobserve once class is added to prevent re-triggering
      observer.unobserve(entry.target);
    }
  });
};

const observerOptions = {
  root: null, // defaults to viewport
  threshold: 0.1, // trigger when 10% of element is in view
  rootMargin: '0px 0px -50px 0px' // offset target bottom slightly
};

const scrollObserver = new IntersectionObserver(revealOnScroll, observerOptions);

revealElements.forEach(element => {
  scrollObserver.observe(element);
});

// Fallback for elements already in viewport on load
document.addEventListener('DOMContentLoaded', () => {
  // Briefly check elements
  setTimeout(() => {
    revealElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom >= 0) {
        el.classList.add('active');
        scrollObserver.unobserve(el);
      }
    });
  }, 200);
});
