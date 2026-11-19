'use strict';
/**
 * EpicKast v1.9.7 — Manifiesto de Arte Caricatura y Pósters Anime (`window.EKCartoonArtManifest`)
 * Centraliza las rutas locales optimizadas (.webp) para banners de perfil, Dojo Elemental,
 * cartas especiales y Turbo Core sin depender de ningún recurso externo ni CDN.
 */
(function (global) {
  const MANIFEST = Object.freeze({
    version: '1.9.7',
    style: 'club-penguin-cartoon',
    dojoHero: 'assets/cartoon/dojo_hero.webp',
    racerHero: 'assets/cartoon/racer_hero.webp',
    ninjaEmblem: 'assets/cartoon/ninja_emblem.webp',
    cards: Object.freeze({
      fireDragon: 'assets/cartoon/card_fire_dragon.webp',
      firePhoenix: 'assets/cartoon/card_fire_phoenix.webp',
      waterSplash: 'assets/cartoon/card_water_splash.webp',
      snowYeti: 'assets/cartoon/card_snow_yeti.webp'
    }),
    banners: Object.freeze([
      Object.freeze({
        id: 'cartoon_dojo_courtyard',
        name: 'Patio del Dojo (Caricatura)',
        value: "url('assets/cartoon/banner_dojo_courtyard.webp') center/cover no-repeat"
      }),
      Object.freeze({
        id: 'cartoon_sunny_valley',
        name: 'Valle Soleado (Caricatura)',
        value: "url('assets/cartoon/banner_sunny_valley.webp') center/cover no-repeat"
      }),
      Object.freeze({
        id: 'cartoon_snow_track',
        name: 'Cumbre Nevada (Caricatura)',
        value: "url('assets/cartoon/banner_snow_track.webp') center/cover no-repeat"
      })
    ]),
    profileBanners: Object.freeze([
      Object.freeze({
        id: 'promo_crimson_shinobi',
        name: 'Crimson Moon · Kurogane',
        badge: 'ANIME EXPO',
        path: 'assets/banners/promo_crimson_shinobi.webp',
        value: "url('assets/banners/promo_crimson_shinobi.webp') center/cover no-repeat"
      }),
      Object.freeze({
        id: 'promo_neotokyo_drift_gp',
        name: 'Shibuya Drift GP · Renji',
        badge: 'DRIFT GP',
        path: 'assets/banners/promo_neotokyo_drift_gp.webp',
        value: "url('assets/banners/promo_neotokyo_drift_gp.webp') center/cover no-repeat"
      }),
      Object.freeze({
        id: 'promo_cyber_idol_matsuri',
        name: 'Cyber Matsuri · Akira',
        badge: 'LIVE STAGE',
        path: 'assets/banners/promo_cyber_idol_matsuri.webp',
        value: "url('assets/banners/promo_cyber_idol_matsuri.webp') center/cover no-repeat"
      }),
      Object.freeze({
        id: 'promo_elemental_clash_tournament',
        name: 'Elemental Clash · Torneo Dojo',
        badge: 'TORNEO DOJO',
        path: 'assets/banners/promo_elemental_clash_tournament.webp',
        value: "url('assets/banners/promo_elemental_clash_tournament.webp') center/cover no-repeat"
      }),
      Object.freeze({
        id: 'promo_shadow_flame_chronicles',
        name: 'Dual-Soul · Kaelen',
        badge: 'KEY VISUAL',
        path: 'assets/banners/promo_shadow_flame_chronicles.webp',
        value: "url('assets/banners/promo_shadow_flame_chronicles.webp') center/cover no-repeat"
      }),
      Object.freeze({
        id: 'promo_frost_vs_ignis_rivals',
        name: 'Rival Showdown · Ignis vs. Zero-Frost',
        badge: 'VERSUS',
        path: 'assets/banners/promo_frost_vs_ignis_rivals.webp',
        value: "url('assets/banners/promo_frost_vs_ignis_rivals.webp') center/cover no-repeat"
      }),
      Object.freeze({
        id: 'promo_colossus_raid_event',
        name: 'Colossus Raid · Titán de Obsidiana',
        badge: 'RAID BOSS',
        path: 'assets/banners/promo_colossus_raid_event.webp',
        value: "url('assets/banners/promo_colossus_raid_event.webp') center/cover no-repeat"
      }),
      Object.freeze({
        id: 'promo_aurora_sanctuary_fest',
        name: 'Boreal Aurora · Winter Fest',
        badge: 'FESTIVAL',
        path: 'assets/banners/promo_aurora_sanctuary_fest.webp',
        value: "url('assets/banners/promo_aurora_sanctuary_fest.webp') center/cover no-repeat"
      })
    ]),
    dojoSprites: null,
    racerSprites: null
  });

  if (global) {
    global.EKCartoonArtManifest = MANIFEST;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MANIFEST;
  }
})(typeof window !== 'undefined' ? window : globalThis);
