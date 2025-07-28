document.addEventListener('DOMContentLoaded', function() {
    // Sistema de experiência musical avançado
    const musicalExperiences = new Map();
    let currentExperience = null;
    let isAudioEnabled = false;
    let isMuted = false;

    // Configura o botão de mudo
    const muteToggle = document.getElementById('mute-toggle');
    if (muteToggle) {
        muteToggle.addEventListener('click', toggleMute);
    }

    function toggleMute() {
        isMuted = !isMuted;
        muteToggle.classList.toggle('muted', isMuted);
        
        // Aplica o mute a todas as experiências de áudio
        musicalExperiences.forEach(experience => {
            experience.audio.muted = isMuted;
        });
        
        // Feedback visual
        if (isMuted) {
            document.body.classList.add('audio-muted');
            console.log('Áudio desativado');
        } else {
            document.body.classList.remove('audio-muted');
            console.log('Áudio ativado');
        }
    }

    // Carrega configurações da experiência
    async function loadExperienceConfig(musical) {
        try {
            const response = await fetch(`audio/${musical}/config.json`);
            const config = await response.json();
            return {
                ...config.audios[0],
                fadeIn: config.audios[0].fadeIn || 800,
                fadeOut: config.audios[0].fadeOut || 1000
            };
        } catch (error) {
            console.error(`Erro ao carregar experiência ${musical}:`, error);
            return null;
        }
    }

    // Cria experiência musical imersiva
    function createMusicalExperience(musical, config) {
        const audio = new Audio(`audio/${musical}/${config.nome}`);
        audio.volume = 0;
        audio.preload = 'auto';
        audio.muted = isMuted; // Respeita o estado de mudo
        
        let fadeInterval;
        let isTransitioning = false;

        const fadeAudio = (targetVolume, duration, onComplete) => {
            if (isTransitioning) {
                clearInterval(fadeInterval);
            }
            
            const initialVolume = audio.volume;
            const delta = targetVolume - initialVolume;
            const steps = duration / 20;
            const stepSize = delta / steps;
            
            let step = 0;
            isTransitioning = true;
            
            fadeInterval = setInterval(() => {
                step++;
                audio.volume = initialVolume + (stepSize * step);
                
                if ((stepSize > 0 && audio.volume >= targetVolume) || 
                    (stepSize < 0 && audio.volume <= targetVolume)) {
                    audio.volume = targetVolume;
                    clearInterval(fadeInterval);
                    isTransitioning = false;
                    if (onComplete) onComplete();
                }
            }, 20);
        };

        audio.addEventListener('timeupdate', function() {
            if (isTransitioning) return;
            
            if (config.tempo_fim - audio.currentTime < (config.fadeOut/1000)) {
                fadeAudio(0, config.fadeOut, () => {
                    if (config.loop) {
                        audio.currentTime = config.tempo_inicio;
                        fadeAudio(config.volume || 0.7, config.fadeIn);
                    } else {
                        audio.pause();
                        audio.currentTime = config.tempo_inicio;
                        updateExperienceIndicator(musical, false);
                    }
                });
            }
        });

        return { audio, fadeAudio, musical };
    }

    // Atualiza o indicador visual da experiência
    function updateExperienceIndicator(musical, isActive) {
        const card = document.querySelector(`.musical-card[data-musical="${musical}"]`);
        if (card) {
            card.classList.toggle('active-experience', isActive);
            const indicator = card.querySelector('.audio-indicator');
            if (indicator) {
                indicator.style.opacity = isActive ? '1' : '0';
                indicator.style.animation = isActive ? 'pulse 1.5s infinite' : 'none';
            }
        }
    }

    // Inicia experiência musical
    async function startMusicalExperience(musical) {
        if (!isAudioEnabled) return;

        // Interrompe experiência atual
        if (currentExperience) {
            currentExperience.fadeAudio(0, 500, () => {
                currentExperience.audio.pause();
                currentExperience.audio.currentTime = 0;
                updateExperienceIndicator(currentExperience.musical, false);
            });
        }

        // Carrega configurações
        const config = await loadExperienceConfig(musical);
        if (!config) return;

        // Validação de tempo
        if (config.tempo_fim <= config.tempo_inicio) {
            console.error(`Configuração inválida: tempo_fim deve ser maior que tempo_inicio`);
            return;
        }

        // Cria ou reutiliza a experiência
        if (!musicalExperiences.has(musical)) {
            const experience = createMusicalExperience(musical, config);
            musicalExperiences.set(musical, experience);
        }

        const experience = musicalExperiences.get(musical);
        experience.audio.currentTime = config.tempo_inicio;
        currentExperience = experience;

        try {
            await experience.audio.play();
            experience.fadeAudio(config.volume || 0.7, config.fadeIn);
            updateExperienceIndicator(musical, true);
        } catch (error) {
            console.error("Erro ao iniciar experiência:", error);
        }
    }

    // Configura interações com os cards
    document.querySelectorAll('.musical-card').forEach(card => {
        const musical = card.dataset.musical;
        
        card.addEventListener('mouseenter', () => startMusicalExperience(musical));
        card.addEventListener('mouseleave', () => {
            if (currentExperience && currentExperience.musical === musical) {
                currentExperience.fadeAudio(0, 500, () => {
                    currentExperience.audio.pause();
                    currentExperience.audio.currentTime = 0;
                    updateExperienceIndicator(musical, false);
                });
            }
        });

        // Toque para dispositivos móveis
        card.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                startMusicalExperience(musical);
            }
        });
    });

    // Ativação de áudio para mobile
    function enableAudio() {
        isAudioEnabled = true;
        document.removeEventListener('click', enableAudio);
        document.removeEventListener('touchstart', enableAudio);
        
        // Feedback visual
        document.body.classList.add('audio-enabled');
        console.log('Experiência musical ativada');
    }

    // Ativa ao primeiro toque/clique (requisito de navegadores)
    document.addEventListener('click', enableAudio, { once: true });
    document.addEventListener('touchstart', enableAudio, { once: true });

    // Efeito de partículas
    function initParticles() {
        const canvas = document.getElementById('particles');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const particles = [];
        const particleCount = Math.floor(window.innerWidth / 10);
        
        // Cria partículas
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.2,
                speedY: (Math.random() - 0.5) * 0.2,
                color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.1})`
            });
        }
        
        // Animação das partículas
        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(particle => {
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Movimento
                particle.x += particle.speedX;
                particle.y += particle.speedY;
                
                // Limites da tela
                if (particle.x < 0 || particle.x > canvas.width) {
                    particle.speedX = -particle.speedX;
                }
                if (particle.y < 0 || particle.y > canvas.height) {
                    particle.speedY = -particle.speedY;
                }
            });
            
            requestAnimationFrame(animateParticles);
        }
        
        animateParticles();
        
        // Redimensionamento responsivo
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }
    
    initParticles();
});
