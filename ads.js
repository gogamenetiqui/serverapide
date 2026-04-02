(function() {
    // 1. Détection de l'appareil
    function detectAppareil() {
        const ua = navigator.userAgent.toLowerCase();
        if (/(android|iphone|ipad|mobile)/.test(ua)) return "mobile";
        if (/(windows|linux|macintosh)/.test(ua)) return "pc";
        return "web";
    }

    const appareil = detectAppareil();
    let adsContainer = null;

    // 2. Injection du Style (Design Premium & Apaisant)
    const style = document.createElement("style");
    style.textContent = `
        .netiqui-bandeau {
            position: fixed; bottom: 0; left: 0; right: 0;
            background: rgba(5, 7, 15, 0.98);
            border-top: 1px solid rgba(212, 175, 55, 0.3);
            box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5);
            padding: 12px 20px; z-index: 9999;
            transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
            transform: translateY(100%);
            font-family: 'Segoe UI', Roboto, sans-serif;
        }
        .netiqui-bandeau.active { transform: translateY(0); }
        .netiqui-timeline {
            position: absolute; top: 0; left: 0; height: 3px;
            background: linear-gradient(to right, #1A73E8, #D4AF37);
            width: 100%; transform-origin: left;
            transition: transform 10s linear;
        }
        .netiqui-contenu { display: flex; align-items: center; max-width: 1100px; margin: 0 auto; gap: 15px; }
        .netiqui-item { display: flex; align-items: center; flex: 1; }
        .netiqui-icone { position: relative; width: 50px; height: 50px; flex-shrink: 0; }
        .netiqui-icone::before {
            content: ""; position: absolute; inset: -3px; border-radius: 50%;
            background: conic-gradient(#1A73E8, #000, #FFF, #D4AF37, #1A73E8);
            animation: rotation 5s linear infinite; filter: blur(1px);
        }
        .netiqui-icone img { position: relative; width: 100%; height: 100%; border-radius: 10px; z-index: 2; background: #000; object-fit: cover; }
        @keyframes rotation { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .netiqui-texte { color: #eee; font-size: 0.95rem; line-height: 1.4; flex: 1; }
        .netiqui-annonceur { display: block; font-size: 0.75rem; color: #D4AF37; font-weight: bold; text-transform: uppercase; margin-top: 2px; }
        .netiqui-btn { 
            background: #1A73E8; color: #fff; padding: 8px 20px; border-radius: 30px;
            text-decoration: none; font-size: 0.85rem; font-weight: 600;
            border: 1px solid rgba(255,255,255,0.1); transition: 0.3s;
        }
        .netiqui-btn:hover { background: #1557b0; transform: scale(1.05); }
        .netiqui-fermer { background: none; border: none; color: #666; cursor: pointer; font-size: 1.5rem; transition: 0.3s; }
        .netiqui-fermer:hover { color: #fff; }
    `;
    document.head.appendChild(style);

    // 3. Gestionnaire de cycle
    async function lancerCyclePublicitaire() {
        try {
            // Lecture du fichier à la racine du dépôt
            const res = await fetch("pubdata.json");
            if (!res.ok) throw new Error("Fichier JSON introuvable");
            
            const data = await res.json();
            const maintenant = new Date();

            const pubsActives = data.publicites.filter(pub => {
                const debut = new Date(pub.debut);
                const fin = new Date(pub.fin);
                return (maintenant >= debut && maintenant <= fin) && (pub.plan === "all" || pub.plan === appareil);
            });

            if (pubsActives.length === 0) {
                setTimeout(lancerCyclePublicitaire, 60000); // Re-vérifie dans 1 min
                return;
            }

            if (!adsContainer) {
                adsContainer = document.createElement("div");
                adsContainer.className = "netiqui-bandeau";
                document.body.appendChild(adsContainer);
            }

            for (const pub of pubsActives) {
                // Chemin de l'image : on s'assure qu'il cherche dans le dossier /images/
                const imagePath = pub.img.startsWith('http') ? pub.img : `./images/${pub.img.split('/').pop()}`;

                adsContainer.innerHTML = `
                    <div class="netiqui-timeline" id="ad-tl" style="transform: scaleX(1);"></div>
                    <div class="netiqui-contenu">
                        <div class="netiqui-item">
                            <div class="netiqui-icone"><img src="${imagePath}" alt="Logo"></div>
                            <div class="netiqui-texte">
                                <strong>${pub.titre}</strong> — ${pub.desc}
                                <span class="netiqui-annonceur">Sponsor : ${pub.annonceur}</span>
                            </div>
                            <a href="${pub.lien}" target="_blank" class="netiqui-btn">VOIR</a>
                        </div>
                        <button class="netiqui-fermer">✕</button>
                    </div>
                `;

                adsContainer.classList.add("active");
                const tl = adsContainer.querySelector("#ad-tl");
                
                // Déclenchement de la barre de progression
                setTimeout(() => { if(tl) tl.style.transform = "scaleX(0)"; }, 150);

                let forceStop = false;
                await new Promise(resolve => {
                    const timer = setTimeout(resolve, 10000);
                    adsContainer.querySelector(".netiqui-fermer").onclick = () => {
                        forceStop = true;
                        clearTimeout(timer);
                        resolve();
                    };
                });

                if (forceStop) break;
            }

            adsContainer.classList.remove("active");
            // Le repos "Zen" de 10 minutes
            setTimeout(lancerCyclePublicitaire, 600000); 

        } catch (err) {
            console.error("Erreur Ads Netiqui:", err);
            setTimeout(lancerCyclePublicitaire, 30000);
        }
    }

    lancerCyclePublicitaire();
})();
