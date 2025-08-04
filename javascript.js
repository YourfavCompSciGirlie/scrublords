document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault();
    alert('Thank you for reaching out! We’ll get back to you soon.');
});

// Multilingual support
const translations = {
    en: {
        tagline: "Smarter Appointments for PHC Clinics in Tshwane",
        intro: "PHC clinics in Tshwane face daily overcrowding due to inefficient appointment systems...",
        solution: "QueueWise is a hybrid digital system that allows patients to book appointments via SMS or web..."
    },
    zu: {
        tagline: "Izinhlelo Zokubhuka Ezihlakaniphile Ezibhedlela eTshwane",
        intro: "Izikhungo zezempilo eTshwane zibhekene nokugcwala nsuku zonke ngenxa yezinhlelo zokubhuka ezingasebenzi kahle...",
        solution: "I-QueueWise iyindlela ehlanganisiwe evumela iziguli ukuthi zibuke izikhathi zokuvakasha nge-SMS noma iwebhu..."
    },
    nso: {
        tagline: "Lenaneo la QueueWise le Thusa Dipetlele go Tshwane",
        intro: "Dipatlele tša PHC mo Tshwane di tletše ka batho ka mehla ka lebaka la mananeo a go se be le peakanyo ya nako...",
        solution: "Queue Wise ke lenaneo la go kopanya le le nolofalago leo le dumelelago balwetši go beakanya nako ka SMS goba webosaete..."
    }
};

document.getElementById('language-selector').addEventListener('change', function() {
    const lang = this.value;
    document.getElementById('tagline').textContent = translations[lang].tagline;
    document.querySelector('.intro p').textContent = translations[lang].intro;
    document.querySelector('.solution p').textContent = translations[lang].solution;
});