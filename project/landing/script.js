document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links
    document.querySelectorAll('.nav-links a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Change navbar background on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(17, 24, 39, 0.98)';
            navbar.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.background = 'rgba(17, 24, 39, 0.95)';
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
        }
    });

    // Animate elements on scroll
    const animateOnScroll = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    };

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const sectionObserver = new IntersectionObserver(animateOnScroll, observerOptions);

    document.querySelectorAll('.feature-card, .tech-card, .algorithm-card, .about-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        sectionObserver.observe(el);
    });

    // Hero section animations (for h1 and p, cta-button are handled by CSS directly)
    const heroH1 = document.querySelector('.hero h1');
    const heroP = document.querySelector('.hero p');
    const ctaButton = document.querySelector('.cta-button');

    heroH1.style.opacity = '0';
    heroH1.style.transform = 'translateY(20px)';
    heroH1.style.transition = 'opacity 1s ease, transform 1s ease';

    heroP.style.opacity = '0';
    heroP.style.transform = 'translateY(20px)';
    heroP.style.transition = 'opacity 1s ease 0.2s, transform 1s ease 0.2s';

    ctaButton.style.opacity = '0';
    ctaButton.style.transform = 'translateY(20px)';
    ctaButton.style.transition = 'opacity 1s ease 0.4s, transform 1s ease 0.4s';

    setTimeout(() => {
        heroH1.style.opacity = '1';
        heroH1.style.transform = 'translateY(0)';
        heroP.style.opacity = '1';
        heroP.style.transform = 'translateY(0)';
        ctaButton.style.opacity = '1';
        ctaButton.style.transform = 'translateY(0)';
    }, 100); // Small delay to ensure CSS is applied first


    // Launch button loading animation
    const launchButton = document.getElementById('launchModel');
    if (launchButton) {
        launchButton.addEventListener('click', function (e) {
            e.preventDefault();
            this.classList.add('loading');
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Launching...';

            setTimeout(() => {
                window.location.href = this.href;
                this.classList.remove('loading');
                this.innerHTML = originalText;
            }, 2000);
        });
    }
}); 