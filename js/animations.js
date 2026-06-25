/* ==========================================================================
   YTA Café — Animaciones (GSAP + ScrollTrigger)
   Variante B "El Tejido de la Mano". Movimiento elegante y siempre activo
   (sin respetar prefers-reduced-motion, por decisión de marca): refuerza
   jerarquía (el dato grande, la firma a mano), da feedback de estado
   (hover, scroll del header) y mantiene la página viva entre reveals.
   ========================================================================== */

(function () {
  if (typeof gsap === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  /* -------------------------------------------------------------
     Helper: separa un bloque de texto en palabras envueltas para
     animar con stagger sin depender de SplitText. Cada palabra
     queda en un span con overflow:hidden (.split-word) que clipea
     un span interno animable (translateY).
     ------------------------------------------------------------- */
  function splitWords(el) {
    if (!el || el.dataset.split === "done") return [];
    var text = el.textContent;
    var words = text.split(/\s+/).filter(Boolean);

    el.innerHTML = "";
    var inners = [];

    words.forEach(function (word, i) {
      var outer = document.createElement("span");
      outer.className = "split-word";
      var inner = document.createElement("span");
      inner.textContent = word;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      inners.push(inner);
    });

    el.dataset.split = "done";
    return inners;
  }

  /* Igual que splitWords pero preserva nodos hijos (br, span) que ya
     existen dentro del elemento, recorriendo sólo nodos de texto. Se usa
     en el headline del hero, que contiene <br> y un <span> con subrayado. */
  function splitWordsPreserving(el) {
    if (!el || el.dataset.split === "done") return [];
    var inners = [];

    function wrapTextNode(node) {
      var raw = node.textContent;
      var leading = /^\s+/.test(raw) ? " " : "";
      var trailing = /\s+$/.test(raw) ? " " : "";
      var words = raw.split(/\s+/).filter(Boolean);
      var frag = document.createDocumentFragment();
      if (leading) frag.appendChild(document.createTextNode(" "));
      words.forEach(function (word, i) {
        var outer = document.createElement("span");
        outer.className = "split-word";
        var inner = document.createElement("span");
        inner.textContent = word;
        outer.appendChild(inner);
        frag.appendChild(outer);
        if (i < words.length - 1) frag.appendChild(document.createTextNode(" "));
        inners.push(inner);
      });
      if (trailing) frag.appendChild(document.createTextNode(" "));
      node.parentNode.replaceChild(frag, node);
    }

    function walk(node) {
      var children = Array.prototype.slice.call(node.childNodes);
      children.forEach(function (child) {
        if (child.nodeType === 3 && child.textContent.trim()) {
          wrapTextNode(child);
        } else if (child.nodeType === 1 && child.tagName !== "SVG") {
          walk(child);
        }
      });
    }

    walk(el);
    el.dataset.split = "done";
    return inners;
  }

  /* -------------------------------------------------------------
     Header: compactarse al hacer scroll
     ------------------------------------------------------------- */
  var header = document.querySelector(".site-header");
  if (header) {
    ScrollTrigger.create({
      start: "top -80",
      onUpdate: function (self) {
        header.classList.toggle("is-scrolled", self.scroll() > 80);
      }
    });
  }

  /* -------------------------------------------------------------
     Botón flotante de WhatsApp: entrada + idle pulse continuo
     ------------------------------------------------------------- */
  var waFloat = document.querySelector(".whatsapp-float");
  var waRing = document.querySelector(".whatsapp-float-ring");
  if (waFloat) {
    gsap.from(waFloat, {
      autoAlpha: 0,
      scale: 0.7,
      duration: 0.5,
      delay: 0.8,
      ease: "back.out(1.6)",
      clearProps: "transform,opacity,visibility",
      onComplete: function () {
        if (!waRing) return;
        gsap.to(waRing, {
          scale: 1.55,
          opacity: 0,
          duration: 1.8,
          ease: "sine.out",
          repeat: -1,
          repeatDelay: 1.1
        });
      }
    });
  }

  /* -------------------------------------------------------------
     Trazo SVG "a mano": draw-on. Único lugar de la página donde
     aparece (bajo "mano" en el H1 del hero, ver brief de marca).
     ------------------------------------------------------------- */
  var strokes = gsap.utils.toArray(".hand-stroke");
  strokes.forEach(function (stroke) {
    var path = stroke.querySelector("path");
    if (!path) return;
    var length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

    gsap.to(path, {
      strokeDashoffset: 0,
      duration: 1.1,
      ease: "power2.inOut",
      delay: 1.3
    });
  });

  /* -------------------------------------------------------------
     Hero: entrada inicial — icono, headline por palabras, y dos
     capas de movimiento continuo una vez termina la entrada:
     - idle float muy leve en el icono (yoyo infinito)
     - parallax con scrub al hacer scroll (icono + headline + grain)
     ------------------------------------------------------------- */
  var heroSection = document.querySelector(".hero");
  var heroIcon = document.querySelector(".hero-icon");
  var heroHeadline = document.querySelector(".hero-headline");
  var heroGrain = heroSection ? heroSection.querySelector(".hero-grain") : null;

  if (heroIcon || heroHeadline) {
    var headlineWords = splitWordsPreserving(heroHeadline);

    var heroTl = gsap.timeline({
      defaults: { duration: 0.8, ease: "power3.out" }
    });

    if (heroIcon) {
      heroTl.from(heroIcon, { autoAlpha: 0, y: 22, scale: 0.94 }, 0);
    }
    if (headlineWords.length) {
      heroTl.from(
        headlineWords,
        { yPercent: 115, duration: 0.7, ease: "power3.out", stagger: 0.045 },
        0.18
      );
    } else if (heroHeadline) {
      heroTl.from(heroHeadline, { autoAlpha: 0, y: 24 }, 0.15);
    }

    heroTl.add(function () {
      if (heroIcon) {
        gsap.to(heroIcon, {
          y: -10,
          duration: 2.6,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true
        });
      }
    });
  }

  if (heroSection) {
    /* Parallax sutil al hacer scroll por el hero: el icono y el
       headline se desplazan a velocidades distintas, la textura de
       grano se mueve aún más despacio, dando profundidad. */
    gsap.to(heroIcon, {
      y: -60,
      ease: "none",
      scrollTrigger: {
        trigger: heroSection,
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    gsap.to(heroHeadline, {
      y: -28,
      ease: "none",
      scrollTrigger: {
        trigger: heroSection,
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    if (heroGrain) {
      gsap.to(heroGrain, {
        y: 50,
        ease: "none",
        scrollTrigger: {
          trigger: heroSection,
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });
    }
  }

  /* -------------------------------------------------------------
     Parallax de fondo: capas de grano de las demás secciones se
     mueven a una velocidad distinta al scroll, dando profundidad.
     ------------------------------------------------------------- */
  var otherGrains = gsap.utils.toArray(".section-grain");
  otherGrains.forEach(function (grain) {
    var section = grain.closest("section");
    if (!section) return;
    gsap.to(grain, {
      y: 60,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  });

  /* -------------------------------------------------------------
     Títulos de sección: split por palabras con entrada en stagger,
     en vez de un fade plano del bloque completo.
     ------------------------------------------------------------- */
  var sectionTitles = gsap.utils.toArray(".section-title");
  sectionTitles.forEach(function (title) {
    title.classList.add("split-ready");
    var words = splitWords(title);
    if (!words.length) return;

    gsap.from(words, {
      yPercent: 115,
      duration: 0.65,
      ease: "power3.out",
      stagger: 0.05,
      scrollTrigger: {
        trigger: title,
        start: "top 82%",
        toggleActions: "play none none none"
      }
    });
  });

  /* -------------------------------------------------------------
     Historia: fade/slide sutil al entrar en viewport
     ------------------------------------------------------------- */
  var historiaInner = document.querySelector(".historia-inner");
  if (historiaInner) {
    var historiaTargets = gsap.utils.toArray(
      historiaInner.querySelectorAll(".lead, p:not(.lead)")
    );

    gsap.from(historiaTargets, {
      autoAlpha: 0,
      y: 22,
      duration: 0.7,
      ease: "power2.out",
      stagger: 0.12,
      clearProps: "all",
      scrollTrigger: {
        trigger: historiaInner,
        start: "top 75%",
        toggleActions: "play none none none"
      }
    });
  }

  /* -------------------------------------------------------------
     Producto: texto (título, párrafo, CTA) en stagger, y las dos
     fotos de empaque con fade + slide + leve scale de "asentado".
     La bolsa negra entra después de la frosted, reforzando el
     offset vertical que ya tienen vía CSS (.producto-shot-negra).
     Usamos y relativo ("+=") para no pisar ese translateY(24px) del
     CSS: el punto de partida es el valor actual + el desplazamiento
     de entrada, y el final es el valor actual tal cual (24px en
     desktop, 0 en mobile donde el CSS lo anula).
     ------------------------------------------------------------- */
  var productoText = document.querySelector(".producto-text");
  if (productoText) {
    var productoTextTargets = [
      productoText.querySelector(".section-title"),
      productoText.querySelector("p"),
      productoText.querySelector(".btn-primary")
    ].filter(Boolean);

    if (productoTextTargets.length) {
      gsap.from(productoTextTargets, {
        autoAlpha: 0,
        y: 22,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.12,
        clearProps: "all",
        scrollTrigger: {
          trigger: productoText,
          start: "top 75%",
          toggleActions: "play none none none"
        }
      });
    }
  }

  var productoShots = gsap.utils.toArray(".producto-shot");
  if (productoShots.length) {
    gsap.from(productoShots, {
      autoAlpha: 0,
      y: "+=32",
      scale: 0.96,
      duration: 0.8,
      ease: "power2.out",
      stagger: 0.18,
      clearProps: "opacity,visibility,scale",
      scrollTrigger: {
        trigger: ".producto-shots",
        start: "top 78%",
        toggleActions: "play none none none"
      }
    });
  }

  /* -------------------------------------------------------------
     Catálogo: cards (stagger) y CTA de PDF
     ------------------------------------------------------------- */
  var cards = gsap.utils.toArray(".card");
  if (cards.length) {
    gsap.from(cards, {
      autoAlpha: 0,
      y: 32,
      duration: 0.7,
      ease: "power2.out",
      stagger: 0.18,
      clearProps: "all",
      scrollTrigger: {
        trigger: ".cards-grid",
        start: "top 78%",
        toggleActions: "play none none none"
      }
    });
  }

  var catalogoExtra = document.querySelector(".catalogo-extra");
  if (catalogoExtra) {
    gsap.from(catalogoExtra, {
      autoAlpha: 0,
      y: 18,
      duration: 0.6,
      ease: "power2.out",
      clearProps: "all",
      scrollTrigger: {
        trigger: catalogoExtra,
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });
  }

  /* -------------------------------------------------------------
     Cards del catálogo: tilt 3D sutil siguiendo el cursor.
     Usa quickTo para reusar las tweens en cada moviemiento del
     mouse en vez de crear una nueva por evento (performance).

     Solo se activa en dispositivos con puntero fino y hover real
     (mouse/trackpad). En touch, algunos navegadores emiten un
     mousemove sintético en el primer tap pero nunca disparan el
     mouseleave correspondiente, lo que dejaría la card "torcida"
     (rotación/elevación pegada) de forma permanente.
     ------------------------------------------------------------- */
  var hasFineHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (hasFineHover) {
    cards.forEach(function (card) {
      var rotateXTo = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3" });
      var rotateYTo = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3" });
      var liftTo = gsap.quickTo(card, "y", { duration: 0.5, ease: "power3" });

      gsap.set(card, { transformPerspective: 700, transformStyle: "preserve-3d" });

      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        rotateYTo(px * 8);
        rotateXTo(py * -8);
        liftTo(-4);
      });

      card.addEventListener("mouseleave", function () {
        rotateXTo(0);
        rotateYTo(0);
        liftTo(0);
      });
    });
  }

  /* -------------------------------------------------------------
     Botones primarios: efecto magnético leve siguiendo el cursor
     dentro de su propia área (no decorativo: invita al clic en el
     CTA principal de contacto y en la firma de WhatsApp del hero).
     Mismo guard que el tilt de cards: solo con hover real, para
     evitar que el botón quede desplazado de su sitio en touch.
     ------------------------------------------------------------- */
  if (hasFineHover) {
    var magneticButtons = gsap.utils.toArray(".btn-primary, .btn-outline");
    magneticButtons.forEach(function (btn) {
      var xTo = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3" });
      var yTo = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3" });

      btn.addEventListener("mousemove", function (e) {
        var rect = btn.getBoundingClientRect();
        var relX = e.clientX - (rect.left + rect.width / 2);
        var relY = e.clientY - (rect.top + rect.height / 2);
        xTo(relX * 0.22);
        yTo(relY * 0.32);
      });

      btn.addEventListener("mouseleave", function () {
        xTo(0);
        yTo(0);
      });
    });
  }

  /* -------------------------------------------------------------
     Cards del catálogo: por defecto solo se ve el nombre del café.
     Cada card es independiente — abrir una no afecta a la otra.
     En dispositivos con mouse real, la ficha se abre al poner el
     cursor encima y se cierra al quitarlo; en táctil (sin hover)
     se usa clic/tap como alternativa. La animación es altura
     animada + fade en cascada del contenido. El conteo ascendente
     del dato grande solo se dispara la primera vez que se abre,
     ya que antes de abrir el número no es visible.
     ------------------------------------------------------------- */
  cards.forEach(function (card) {
    var toggle = card.querySelector(".card-toggle");
    var details = card.querySelector(".card-details");
    if (!toggle || !details) return;

    gsap.set(details, { height: 0 });

    var statEl = details.querySelector(".stat-number");
    var counted = false;

    function runCounter() {
      if (counted || !statEl) return;
      counted = true;
      var target = parseInt(statEl.textContent, 10);
      if (isNaN(target)) return;

      var counter = { value: 0 };
      statEl.textContent = "0";
      gsap.to(counter, {
        value: target,
        duration: 1.3,
        ease: "power1.out",
        onUpdate: function () {
          statEl.textContent = Math.round(counter.value);
        },
        onComplete: function () {
          statEl.textContent = target;
        }
      });
    }

    function openCard() {
      if (card.classList.contains("is-open")) return;
      card.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");

      gsap.set(details, { height: "auto" });
      var fullHeight = details.offsetHeight;
      gsap.fromTo(
        details,
        { height: 0 },
        {
          height: fullHeight,
          duration: 0.55,
          ease: "power3.inOut",
          onComplete: function () {
            gsap.set(details, { height: "auto" });
          }
        }
      );

      var innerEls = gsap.utils.toArray(
        details.querySelectorAll(".card-stat, .specs li, .btn-small")
      );
      gsap.fromTo(
        innerEls,
        { autoAlpha: 0, y: 12 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
          stagger: 0.05,
          delay: 0.12
        }
      );

      runCounter();
    }

    function closeCard() {
      if (!card.classList.contains("is-open")) return;
      card.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      gsap.to(details, { height: 0, duration: 0.45, ease: "power3.inOut" });
    }

    if (hasFineHover) {
      card.addEventListener("mouseenter", openCard);
      card.addEventListener("mouseleave", closeCard);
      /* focusin/focusout en toda la card (no focus/blur solo en el botón):
         si solo escucháramos blur del toggle, la ficha se cerraría apenas
         el foco avanza con Tab hacia el enlace "Consultar este café" que
         vive dentro de la misma card, justo cuando el usuario intenta
         usarlo. Con focusout comprobamos que el foco salió de la card
         por completo antes de cerrar. */
      card.addEventListener("focusin", openCard);
      card.addEventListener("focusout", function (e) {
        if (!card.contains(e.relatedTarget)) {
          closeCard();
        }
      });
    } else {
      toggle.addEventListener("click", function () {
        if (card.classList.contains("is-open")) {
          closeCard();
        } else {
          openCard();
        }
      });
    }
  });

  /* -------------------------------------------------------------
     Certificado de origen: el sello entra con un leve "stamp"
     (scale + fade) y el texto lo sigue con un pequeño retraso.
     ------------------------------------------------------------- */
  var sello = document.querySelector(".sello");
  var certificadoText = document.querySelector(".certificado-text");
  if (sello) {
    gsap.from(sello, {
      autoAlpha: 0,
      scale: 0.85,
      duration: 0.7,
      ease: "back.out(1.4)",
      clearProps: "all",
      scrollTrigger: {
        trigger: sello,
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });
  }
  if (certificadoText) {
    gsap.from(certificadoText, {
      autoAlpha: 0,
      y: 18,
      duration: 0.6,
      ease: "power2.out",
      delay: 0.2,
      clearProps: "all",
      scrollTrigger: {
        trigger: certificadoText,
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });
  }

  /* -------------------------------------------------------------
     Contacto: subtítulo, CTA y canales (stagger)
     ------------------------------------------------------------- */
  var contacto = document.querySelector(".contacto");
  if (contacto) {
    var contactoIntro = [
      contacto.querySelector(".contacto-sub"),
      contacto.querySelector(".btn-primary")
    ].filter(Boolean);

    if (contactoIntro.length) {
      gsap.from(contactoIntro, {
        autoAlpha: 0,
        y: 20,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.1,
        clearProps: "all",
        scrollTrigger: {
          trigger: contacto,
          start: "top 75%",
          toggleActions: "play none none none"
        }
      });
    }

    var canales = gsap.utils.toArray(".canal");
    if (canales.length) {
      gsap.from(canales, {
        autoAlpha: 0,
        y: 24,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.1,
        clearProps: "all",
        scrollTrigger: {
          trigger: ".canales",
          start: "top 80%",
          toggleActions: "play none none none"
        }
      });
    }
  }
})();
