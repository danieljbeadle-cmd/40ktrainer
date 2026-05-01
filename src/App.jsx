import { useState, useRef, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// FONTS & HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const GF = `@import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap');`;
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

// ═══════════════════════════════════════════════════════════════════════════════
// CORE RULES FLASHCARD DATA
// ═══════════════════════════════════════════════════════════════════════════════
const CORE_DECKS = [
  { id:"phases", title:"Turn Structure", icon:"⏱",
    cards:[
      { f:"How many phases are in one player's turn?", b:"5 phases, in order:\n1. Command\n2. Movement\n3. Shooting\n4. Charge\n5. Fight\n\nThere is no separate Morale phase — Battle-shock is handled in the Command phase." },
      { f:"Both players gain CP at the start of which phase?", b:"The Command phase. Both players gain 1 CP at the very start of each Command phase, before anything else is resolved." },
      { f:"When are Battle-shock tests taken?", b:"During the Battle-shock step of the Command phase — the second step, after CP is gained and other Command phase abilities are resolved." },
      { f:"What is a Battle Round vs a player Turn?", b:"A Battle Round consists of both players taking their turn. Each player's turn has 5 phases. The same player goes first every battle round." },
    ]},
  { id:"movement", title:"Movement Phase", icon:"👟",
    cards:[
      { f:"What are the three ways a unit can move?", b:"1. Normal Move — up to M characteristic\n2. Advance — up to M + D6\" (cannot shoot or charge)\n3. Remain Stationary — don't move at all\n\nA unit in Engagement Range can only Fall Back." },
      { f:"What is Engagement Range?", b:"1\" horizontally AND 5\" vertically. Any model within these distances of an enemy is 'in Engagement Range'. Models in Engagement Range cannot make Normal, Advance, or Charge moves — only Fall Back." },
      { f:"What happens to terrain 2\" or less in height?", b:"Models can cross it with no movement penalty. Terrain taller than 2\" counts as part of the movement distance (you measure the climb)." },
      { f:"When do Reinforcements arrive?", b:"During the Reinforcements step — the second half of the Movement phase. Units arriving from reserves count as having made a Normal Move and cannot charge that turn." },
      { f:"What is the Deep Strike rule?", b:"A unit with Deep Strike can be held in reserves and deployed during the Reinforcements step. It must be placed more than 9\" horizontally from all enemy models." },
    ]},
  { id:"shooting", title:"Shooting Phase", icon:"🎯",
    cards:[
      { f:"What is the complete attack sequence?", b:"1. Select unit to shoot\n2. Select target (must be visible)\n3. Roll Hit rolls (vs BS)\n4. Roll Wound rolls (S vs T table)\n5. Opponent rolls Saving throws (vs AP)\n6. Apply Damage" },
      { f:"What is the wound roll chart?", b:"Compare Strength to Toughness:\n• S ≥ 2×T → 2+\n• S > T → 3+\n• S = T → 4+\n• S < T → 5+\n• S ≤ ½T → 6+" },
      { f:"What is AP and how does it work?", b:"Armour Penetration. The AP value is subtracted from the target's Save characteristic.\nExample: AP-2 vs a 3+ save → model rolls at 5+.\nAP 0 = no modification." },
      { f:"What is an Invulnerable Save?", b:"A save unaffected by AP. The controlling player always rolls whichever save is better — armour save (after AP) or invulnerable save. They always choose the lower (better) number." },
      { f:"What is a Critical Hit?", b:"An unmodified hit roll of 6. It still counts as a hit, but also triggers special abilities like Sustained Hits (extra hits) or Lethal Hits (auto-wounds). Modifiers don't affect whether a 6 is a critical — it's always the unmodified result." },
      { f:"When does cover NOT help a unit?", b:"A unit with a 3+ save or better does NOT gain the +1 save bonus from cover against AP 0 weapons. Cover still helps against AP weapons (any AP value other than 0)." },
      { f:"Can you shoot into or out of Engagement Range?", b:"No — a unit cannot shoot if it is within Engagement Range of any enemy models. Exception: Pistol weapons can be used even in Engagement Range." },
    ]},
  { id:"fight", title:"Fight Phase", icon:"⚔️",
    cards:[
      { f:"Who fights first in the Fight phase?", b:"1. Units with Fights First ability (including units that charged this turn)\n2. Remaining units of the active player\n3. Opponent's remaining units\n\nCharged units always fight before uncharged units." },
      { f:"What is a Pile In move?", b:"Before fighting, each model in the selected unit can move up to 3\" towards the nearest enemy model. Each model must end closer to (or equal distance from) the nearest enemy. Models in base contact don't move." },
      { f:"What is a Consolidation move?", b:"After a unit finishes fighting, each model can move up to 3\" towards the nearest enemy model OR towards an objective marker (if no enemies are in Engagement Range). Must end closer to target." },
      { f:"Can a unit that Fell Back charge or shoot?", b:"No. A unit that Falls Back cannot shoot or charge that same turn, unless it has a special rule that says otherwise." },
    ]},
  { id:"morale", title:"Battle-shock", icon:"😨",
    cards:[
      { f:"What triggers a Battle-shock test?", b:"A unit must test if it has lost more than half its starting number of models (for multi-model units), or if a single model has fewer than half its starting wounds remaining." },
      { f:"How do you pass a Battle-shock test?", b:"Roll 2D6. If the result is equal to or greater than the unit's Leadership (Ld) value, the test is passed. If the result is lower than Ld, the test fails.\n\nExample: Ld 7+ means roll 2D6 and get 7 or higher to pass — roughly a 58% chance.\n\nNote: Higher Ld numbers are HARDER to meet — Ld 8+ is harder to pass than Ld 6+." },
      { f:"What happens to a Battle-shocked unit?", b:"• OC drops to 0 — cannot contest objectives\n• Cannot benefit from friendly Stratagems\n• On a Fall Back move, each model must pass a Desperate Escape test (roll 1D6; on a 1–2 the model is destroyed)\n• Lasts until the next Command phase." },
    ]},
  { id:"objectives", title:"Objectives & Scoring", icon:"🏴",
    cards:[
      { f:"How do you control an objective marker?", b:"You control an objective if the total OC of your models within 3\" of it is greater than the total OC of your opponent's models within 3\". If equal, whoever held it last retains control." },
      { f:"What does 'Sticky' objectives mean?", b:"Some faction abilities let a unit 'sticky' an objective — it remains under your control even after all your models have left, until the enemy scores it with models of their own." },
      { f:"What does a Battle-shocked unit lose regarding objectives?", b:"Its OC drops to 0. A Battle-shocked unit contributes nothing to objective control, even if models are within 3\" of the marker." },
    ]},
  { id:"stratagems", title:"Stratagems & CP", icon:"💠",
    cards:[
      { f:"What are the 10 universal Core Stratagems?", b:"Battle Tactic:\n1. Command Re-roll (1CP) — re-roll one die or saving throw\n2. Go to Ground (1CP) — INFANTRY gain 6+ invuln + cover when targeted\n\nEpic Deed:\n3. Insane Bravery (1CP) — auto-pass one Battle-shock test (once per battle)\n4. Epic Challenge (1CP) — one CHARACTER melee attacks gain Precision\n\nStrategic Ploy:\n5. Counter-offensive (2CP) — fight after an enemy unit fights\n6. Fire Overwatch (1CP) — shoot in opponent's Move/Charge (must roll 6 to hit)\n7. Rapid Ingress (1CP) — bring a Reserves unit on at end of opponent's Movement\n8. Heroic Intervention (1CP) — declare a charge against the unit that just charged\n\nWargear:\n9. Grenade (1CP) — roll 6D6, each 4+ = 1 mortal wound on a target within 8\"\n10. Smokescreen (1CP) — SMOKE unit gains cover + Stealth when targeted" },
      { f:"Can the same Stratagem be used more than once per phase?", b:"No. Each Stratagem can only be used once per phase (unless stated otherwise). You can use different Stratagems in the same phase, but not the same one twice." },
      { f:"When are re-rolls applied — before or after modifiers?", b:"Re-rolls are always applied BEFORE modifiers. You re-roll the raw dice result, then apply any +1/-1 modifiers to the new result. You can never re-roll a die more than once." },
      { f:"What is the Fire Overwatch Stratagem?", b:"Cost: 1CP. Timing: opponent's Movement or Charge phase.\n\nEffect: one eligible unit shoots at a visible enemy within 24\".\n\nCRITICAL RULE: Each attack must roll an unmodified 6 to hit — regardless of the weapon's BS or any modifiers. Cannot target TITANIC units. Once per turn only." },
    ]},
  { id:"dice", title:"Dice & Modifiers", icon:"🎲",
    cards:[
      { f:"What is a D3 roll, and how is it calculated?", b:"Roll a D6 and halve the result, rounding up:\n1–2 → 1\n3–4 → 2\n5–6 → 3\nYou never use an actual 3-sided die." },
      { f:"Can modifiers take a roll below 1 or above 6?", b:"No. No matter how many modifiers apply, a natural roll of 1 always fails hit and wound rolls, and a natural roll of 6 always succeeds (for unmodified critical effects). However modifiers CAN push required rolls beyond 6 (making them impossible)." },
      { f:"What is the sequencing rule for simultaneous effects?", b:"If two or more rules apply at the same time during a player's turn, the active player chooses the order. If it happens at the start or end of a battle round, the players roll off to decide." },
      { f:"Can you measure distances before declaring actions?", b:"Yes. You can measure distances at any time — there is no 'measurement commitment'. This is intentional to reduce random guessing errors." },
    ]},
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMMON MISTAKES — baked into quiz questions across 3 categories
// Each question has: q (stem), options [A,B,C,D], correct index, explanation, mistake tag
// Options are PEDAGOGICALLY designed: 1 correct + 3 plausible wrong answers
// ═══════════════════════════════════════════════════════════════════════════════
const CORE_QUIZ = [
  // ── REROLLS & MODIFIERS ──────────────────────────────────────────────
  {
    tag:"⚠️ COMMON MISTAKE", cat:"Rerolls & Modifiers",
    q:"You have a re-roll ability and also get +1 to hit. A model rolls a 2 to hit (needs 3+). You re-roll and get a 3. What result do you apply?",
    opts:["The 3 hits — re-roll succeeds before modifier applies","The 3+1=4 hits — re-rolls and modifiers both apply","The 2 fails — you can't re-roll modified rolls","The 3 fails — modifiers apply to original roll, not re-rolls"],
    correct:0,
    explanation:"Re-rolls are always applied BEFORE modifiers. You re-rolled the 2 and got a 3. Then +1 modifier applies → effective result 4. The attack hits. The modifier never changes whether you re-roll — it only affects the final result."
  },
  {
    tag:"⚠️ COMMON MISTAKE", cat:"Rerolls & Modifiers",
    q:"A model rolls a natural 1 to hit but has a +1 to hit modifier. Does the attack hit?",
    opts:["Yes — 1+1=2, which meets most BS values","No — a natural 1 always fails a Hit roll","Yes — only wound rolls always fail on a natural 1","No — modifiers cannot apply to unmodified results"],
    correct:1,
    explanation:"An unmodified (natural) roll of 1 always fails a hit roll, regardless of any modifiers. This is the auto-fail rule. The +1 modifier is irrelevant here."
  },
  {
    tag:"⚠️ COMMON MISTAKE", cat:"Rerolls & Modifiers",
    q:"You use a Stratagem that re-rolls hit rolls for a unit. During that same phase, can you also use the 'Command Re-roll' (1CP) core Stratagem to re-roll one of those same dice again?",
    opts:["Yes — Command Re-roll applies to any die","No — you can never re-roll a die more than once","Yes — Stratagems and abilities stack freely","No — you can only use one Stratagem per phase"],
    correct:1,
    explanation:"A dice can never be re-rolled more than once, regardless of which abilities or Stratagems are being used. Once a die has been re-rolled (by any source), it cannot be re-rolled again."
  },
  // ── FIGHT PHASE ──────────────────────────────────────────────────────
  {
    tag:"⚠️ COMMON MISTAKE", cat:"Fight Phase",
    q:"Your unit charged this turn. Your opponent has a unit with the Fights First ability. Who fights first?",
    opts:["Your charged unit, because charging grants Fights First","Your opponent's Fights First unit","They fight simultaneously — both players roll off","The player whose turn it is always fights first"],
    correct:0,
    explanation:"Charged units gain Fights First for that turn. Both your charged unit and the opponent's Fights First unit have Fights First, so the active player (whose turn it is) chooses the order among all Fights First units."
  },
  {
    tag:"⚠️ COMMON MISTAKE", cat:"Fight Phase",
    q:"Your unit makes a Pile In move. Where must each model move TO?",
    opts:["Towards the closest objective marker","Towards the nearest enemy model — each model must end closer to it","Towards the enemy unit's unit champion","Wherever helps keep unit coherency best"],
    correct:1,
    explanation:"Each model in a Pile In must end its move closer to the nearest enemy model (or in base contact if possible). Models already in base contact don't move. The pile in cannot take models away from the nearest enemy."
  },
  {
    tag:"⚠️ COMMON MISTAKE", cat:"Fight Phase",
    q:"After fighting, your unit destroys the last enemy model in Engagement Range. What can it do with its Consolidation move?",
    opts:["Move 3\" in any direction freely","Move up to 3\" towards the nearest enemy model OR towards an objective marker","Remain stationary — consolidation only applies while enemies are present","Move up to 6\" since the enemy is destroyed"],
    correct:1,
    explanation:"Consolidation is 3\" towards the nearest enemy model OR towards an objective marker (if no enemies are in Engagement Range and the unit ends closer to or on the marker). It is NOT a free 3\" in any direction."
  },
  // ── ENGAGEMENT RANGE & SHOOTING ──────────────────────────────────────
  {
    tag:"⚠️ COMMON MISTAKE", cat:"Shooting & Engagement",
    q:"Your unit is 0.5\" away from an enemy model horizontally but 6\" above it on a ruin. Are they in Engagement Range?",
    opts:["Yes — they are within 1\" horizontally","No — Engagement Range is 1\" horizontal AND 5\" vertical, so 6\" vertical is outside","Yes — vertical distance doesn't count for Engagement Range","No — you need base contact for Engagement Range"],
    correct:1,
    explanation:"Engagement Range is 1\" horizontally AND 5\" vertically. 6\" of vertical separation exceeds the 5\" vertical component, so the models are NOT in Engagement Range, even if only 0.5\" apart horizontally."
  },
  {
    tag:"⚠️ COMMON MISTAKE", cat:"Shooting & Engagement",
    q:"An Infantry unit Advances. Which of these can it still do that turn?",
    opts:["Shoot with all its ranged weapons at -1 to hit","Shoot with Pistol weapons only","It cannot shoot at all but may charge","It cannot shoot or charge this turn"],
    correct:3,
    explanation:"A unit that Advances cannot shoot (no weapons, including Pistols) and cannot charge that turn. The only exception is if a special rule specifically allows it (e.g. some weapons have the Assault keyword granting no penalty, but Advancing still prevents charging)."
  },
  {
    tag:"⚠️ COMMON MISTAKE", cat:"Shooting & Engagement",
    q:"A unit is in Engagement Range of an enemy. What weapons can it still fire?",
    opts:["Any ranged weapon at -1 to hit","Only Pistol weapons — they ignore the Engagement Range restriction","No weapons — cannot shoot while in Engagement Range","Only heavy weapons, which are unaffected"],
    correct:1,
    explanation:"Only Pistol weapons can be used while a unit is within Engagement Range of enemy models. All other ranged weapons are restricted. This is the main exception to the 'no shooting in Engagement Range' rule."
  },
  // ── COVER & SAVES ────────────────────────────────────────────────────
  {
    tag:"⚠️ COMMON MISTAKE", cat:"Cover & Saves",
    q:"A unit with a 3+ armour save is in cover and is hit by an AP 0 weapon. Do they get the +1 cover bonus?",
    opts:["Yes — cover always gives +1 to armour saves","No — units with 3+ save or better don't benefit from cover against AP 0 weapons","Yes — AP 0 is the weakest AP so cover helps most","No — cover only helps against AP -1 or worse"],
    correct:1,
    explanation:"Units with a 3+ save or better do NOT gain the +1 save bonus from cover against AP 0 attacks. This prevents already-tough units from becoming near-invincible. Cover DOES help these units against weapons with any AP value (AP-1 or worse)."
  },
  {
    tag:"⚠️ COMMON MISTAKE", cat:"Cover & Saves",
    q:"A model has a 4+ armour save and a 5+ invulnerable save. An AP-2 weapon hits it. Which save can it use?",
    opts:["4+ armour save — armour always takes priority","5+ invulnerable save — the only option after AP-2","Player's choice — always pick whichever is better (4+2=6+, so invuln 5+ wins)","No save — AP-2 negates both saves"],
    correct:2,
    explanation:"AP-2 worsens the 4+ armour save to 6+. The player compares available saves: 6+ (armour after AP) vs 5+ (invulnerable, unaffected by AP). The player ALWAYS chooses whichever is better — so they roll the 5+ invulnerable save."
  },
  {
    tag:"⚠️ COMMON MISTAKE", cat:"Cover & Saves",
    q:"A weapon does 3 damage and the target has a Feel No Pain (FNP) 5+ ability. The model fails its armour save. How many FNP rolls are made?",
    opts:["1 roll for the whole wound — it either saves or doesn't","3 rolls — one for each point of damage","2 rolls — damage minus 1 for the failed save","The FNP only triggers on the final point of damage"],
    correct:1,
    explanation:"Feel No Pain is rolled once per point of damage, not once per wound. If a model suffers 3 damage, it rolls three separate FNP dice, potentially negating each damage point individually. This is a very commonly misplayed interaction."
  },
  // ── DEEP STRIKE & RESERVES ───────────────────────────────────────────
  {
    tag:"⚠️ COMMON MISTAKE", cat:"Reserves & Deep Strike",
    q:"A unit arrives via Deep Strike. What distance must it be from enemy models?",
    opts:["More than 6\" from all enemy models","More than 9\" horizontally from all enemy models","More than 9\" in any direction from all enemy models","More than 12\" from enemy units (not models)"],
    correct:1,
    explanation:"Deep Strike units must be placed more than 9\" HORIZONTALLY from all enemy models. The vertical component is not measured — only horizontal distance matters. It's also measured to individual models, not the unit as a whole."
  },
  {
    tag:"⚠️ COMMON MISTAKE", cat:"Reserves & Deep Strike",
    q:"A unit arrives from Strategic Reserves at the end of your opponent's Movement phase. Can it charge that same turn?",
    opts:["Yes — it arrived and is now on the battlefield","No — units arriving from reserves cannot charge the turn they arrive","Yes — only units that Advanced cannot charge","No — but it can shoot normally"],
    correct:1,
    explanation:"Units arriving from reserves count as having made a Normal Move that turn. They can shoot (if eligible), but cannot charge, since a unit must not have Advanced or arrived from reserves to declare a charge."
  },
  // ── BATTLE-SHOCK & MORALE ────────────────────────────────────────────
  {
    tag:"⚠️ COMMON MISTAKE", cat:"Battle-shock",
    q:"A unit is Battle-shocked. Your opponent uses a Stratagem targeting that unit. Is this allowed?",
    opts:["Yes — Stratagems can always target any unit","No — Battle-shocked units cannot be affected by the controlling player's Stratagems (not the opponent's)","No — no Stratagems can target a Battle-shocked unit from either player","Yes — Stratagems are not abilities so they are unaffected"],
    correct:1,
    explanation:"Battle-shocked units cannot be affected by Stratagems from THEIR OWN CONTROLLING PLAYER. The opponent CAN still target a Battle-shocked enemy unit with their own Stratagems. This is a commonly misread restriction."
  },
  {
    tag:"⚠️ COMMON MISTAKE", cat:"Battle-shock",
    q:"You roll 2D6 for a Battle-shock test. The unit's Leadership is 7+. Your roll is 8. What happens?",
    opts:["Test passed — 8 equals or exceeds the Leadership value of 7","Test failed — you needed to roll equal to or under 7, and 8 > 7","Test passed — Leadership 7+ means you pass on 7 or more... wait, 8 is more than 7","Test failed — Ld 7+ means you always need exactly 7"],
    correct:0,
    explanation:"To pass a Battle-shock test, roll 2D6 and get equal to or ABOVE the unit's Leadership value. Ld 7+ means you need 7 or higher. A roll of 8 passes — 8 ≥ 7. Many players wrongly think you need to roll UNDER Leadership, like old editions."
  },
  // ── STRATAGEMS & SEQUENCING ─────────────────────────────────────────
  {
    tag:"⚠️ COMMON MISTAKE", cat:"Stratagems & Sequencing",
    q:"You use Fire Overwatch (1CP) to shoot in your opponent's charge phase. The shooting unit has a special ability that triggers 'in your Shooting phase after this model has shot.' Does the ability trigger?",
    opts:["Yes — Fire Overwatch lets you shoot as if it were your Shooting phase, so all abilities apply","No — out-of-phase rules only let you perform the specific action; other Shooting phase abilities don't trigger","Yes — all shooting follows the same rules regardless of phase","No — you can't use Fire Overwatch in the Charge phase"],
    correct:1,
    explanation:"Out-of-phase rules (like Fire Overwatch) only allow the specific action listed. They do NOT trigger any other rules that normally happen 'in your Shooting phase'. This is explicitly covered in the core rules."
  },
  {
    tag:"⚠️ COMMON MISTAKE", cat:"Stratagems & Sequencing",
    q:"Two of your rules both want to apply at exactly the same moment during your opponent's turn. Who decides the order?",
    opts:["The active player (your opponent) decides the order","You decide — it's your army's rules","Roll off to determine who decides","The rule with the higher CP cost applies first"],
    correct:0,
    explanation:"When two rules trigger simultaneously during a player's turn, the active player (the one whose turn it is) decides the order. If it's at the start or end of a battle round (not a specific turn), both players roll off."
  },
  // ── TERRAIN & VISIBILITY ────────────────────────────────────────────
  {
    tag:"⚠️ COMMON MISTAKE", cat:"Terrain & Visibility",
    q:"A model can see any part of an enemy model — just one limb is visible. Can it target that enemy unit?",
    opts:["No — you need to see the majority of the model","Yes — true line of sight means any visible part of any model makes the unit targetable","No — you need to see the model's torso to target it","Yes — but only if more than one model in the unit is visible"],
    correct:1,
    explanation:"Warhammer 40k uses true line of sight. If any part of any model in a unit is visible to the attacker (including just a limb or weapon), that unit can be targeted. The base also counts as part of the model."
  },
  {
    tag:"⚠️ COMMON MISTAKE", cat:"Terrain & Visibility",
    q:"Terrain is 3\" tall. A model without Fly wants to climb it. How does this affect movement?",
    opts:["Ignore the height — all terrain is treated as flat","The 3\" height is added to the movement distance used","The model cannot climb terrain over 2\" tall","The model can cross it freely if it has a 4+ save or better"],
    correct:1,
    explanation:"Terrain taller than 2\" counts as part of the movement distance. A model climbing 3\" up and 3\" across uses 6\" of its movement allowance. Only terrain 2\" or less can be crossed without any movement penalty."
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// FACTION DATA
// ═══════════════════════════════════════════════════════════════════════════════
const FACTIONS = {
  sororitas:{
    name:"Adepta Sororitas", short:"Sisters of Battle", icon:"✝️",
    color:"#8b001a", accent:"#ff6b6b",
    detachments:[
      { name:"Righteous Crusaders", rule:"Fury of the Righteous",
        desc:"Each time a unit from this detachment is selected to shoot or fight, if it is at full strength it can re-roll one Hit roll and one Wound roll. If below Half-strength, it can re-roll all Hit and Wound rolls instead.",
        strats:[
          { name:"Sacred Rites", cp:1, when:"Before a unit shoots or fights", effect:"That unit's weapons gain +1 Strength until end of phase." },
          { name:"Martyr's Blessing", cp:2, when:"When a unit is destroyed", effect:"Before removing it, that unit can shoot or fight as if it were your turn." },
          { name:"Vow of Purity", cp:1, when:"Command phase", effect:"One unit gains Fights First until your next Command phase." },
        ]},
      { name:"Hallowed Martyrs", rule:"Blessed by Suffering",
        desc:"Each time a unit with this ability loses a model, roll a D6. On a 5+, that unit gains a Miracle Dice token. Miracle Dice can substitute for any single dice roll.",
        strats:[
          { name:"Blood of Martyrs", cp:1, when:"When a model fails a saving throw", effect:"That wound is ignored on a 4+." },
          { name:"Final Sacrifice", cp:2, when:"When a CHARACTER is about to be destroyed", effect:"It survives on 1 wound and deals D3 mortal wounds to the nearest enemy unit." },
        ]},
    ],
    units:[
      // Characters
      { name:"Canoness", role:"Character", stats:{M:"6\"",T:3,Sv:"3+",W:4,Ld:"7+",OC:1}, wpn:{name:"Hallowed Chainsword",A:5,BS:"2+",S:3,AP:-1,D:1}, abilities:["Acts of Faith","Sacred Command","The Emperor's Grace"], keywords:["Infantry","Character","Canoness"] },
      { name:"Morvenn Vahl", role:"Epic Hero", stats:{M:"6\"",T:4,Sv:"2+",W:8,Ld:"5+",OC:1}, wpn:{name:"Lance of Illumination",A:3,BS:"2+",S:8,AP:-3,D:"D6"}, abilities:["Acts of Faith","Abbess Sanctorum","Warlord"], keywords:["Infantry","Character","Epic Hero","Morvenn Vahl"] },
      { name:"Saint Celestine", role:"Epic Hero", stats:{M:"12\"",T:3,Sv:"3+",W:6,Ld:"5+",OC:1}, wpn:{name:"Ardent Blade",A:6,BS:"2+",S:6,AP:-3,D:2}, abilities:["Acts of Faith","Miraculous Intervention","Saintly Aura"], keywords:["Infantry","Character","Epic Hero","Jump Pack","Saint Celestine"] },
      { name:"Palatine", role:"Character", stats:{M:"6\"",T:3,Sv:"3+",W:4,Ld:"7+",OC:1}, wpn:{name:"Bolt Pistol",A:1,BS:"2+",S:4,AP:0,D:1}, abilities:["Acts of Faith","Rapturous Blows","Lead the Righteous"], keywords:["Infantry","Character","Palatine"] },
      { name:"Dialogus", role:"Character", stats:{M:"6\"",T:3,Sv:"3+",W:3,Ld:"6+",OC:1}, wpn:{name:"Staff of the Ecclesiarchy",A:3,BS:"4+",S:4,AP:0,D:1}, abilities:["Acts of Faith","Laud Hailer","Stirring Rhetoric"], keywords:["Infantry","Character","Dialogus"] },
      { name:"Hospitaller", role:"Character", stats:{M:"6\"",T:3,Sv:"3+",W:3,Ld:"6+",OC:1}, wpn:{name:"Chirurgeon's Tools",A:3,BS:"4+",S:3,AP:0,D:1}, abilities:["Acts of Faith","Healing Hands","Martyr's Vigil"], keywords:["Infantry","Character","Hospitaller"] },
      { name:"Dogmata", role:"Character", stats:{M:"6\"",T:3,Sv:"3+",W:4,Ld:"5+",OC:1}, wpn:{name:"Mace of the Righteous",A:4,BS:"2+",S:5,AP:-1,D:2}, abilities:["Acts of Faith","Chorus of Spiritual Fortitude","Invigorating Litanies"], keywords:["Infantry","Character","Dogmata"] },
      { name:"Imagifier", role:"Character", stats:{M:"6\"",T:3,Sv:"3+",W:3,Ld:"6+",OC:1}, wpn:{name:"Litanies of Faith",A:3,BS:"4+",S:4,AP:0,D:1}, abilities:["Acts of Faith","Tale of the Faithful"], keywords:["Infantry","Character","Imagifier"] },
      // Battleline
      { name:"Battle Sister Squad", role:"Battleline", stats:{M:"6\"",T:3,Sv:"3+",W:1,Ld:"6+",OC:2}, wpn:{name:"Boltgun",A:2,BS:"3+",S:4,AP:0,D:1}, abilities:["Acts of Faith","Order Convictions"], keywords:["Infantry","Battleline","Battle Sisters"] },
      // Other
      { name:"Seraphim Squad", role:"Fast Attack", stats:{M:"12\"",T:3,Sv:"3+",W:1,Ld:"6+",OC:1}, wpn:{name:"Bolt Pistol ×2",A:2,BS:"3+",S:4,AP:0,D:1}, abilities:["Acts of Faith","Angelic Descent"], keywords:["Infantry","Jump Pack","Seraphim"] },
      { name:"Zephyrim Squad", role:"Fast Attack", stats:{M:"12\"",T:3,Sv:"3+",W:1,Ld:"6+",OC:1}, wpn:{name:"Power Sword",A:3,BS:"3+",S:4,AP:-2,D:1}, abilities:["Acts of Faith","Swooping Assault"], keywords:["Infantry","Jump Pack","Zephyrim"] },
      { name:"Celestian Sacresants", role:"Elites", stats:{M:"6\"",T:3,Sv:"3+",W:2,Ld:"6+",OC:1}, wpn:{name:"Hallowed Mace",A:3,BS:"3+",S:5,AP:-1,D:1}, abilities:["Acts of Faith","Sworn Protectors"], keywords:["Infantry","Celestian Sacresants"] },
      { name:"Repentia Squad", role:"Elites", stats:{M:"7\"",T:3,Sv:"6+",W:2,Ld:"8+",OC:1}, wpn:{name:"Penitent Eviscerator",A:4,BS:"3+",S:6,AP:-2,D:2}, abilities:["Acts of Faith","Zealot","Penitent Blows"], keywords:["Infantry","Repentia"] },
      { name:"Arco-flagellants", role:"Elites", stats:{M:"7\"",T:3,Sv:"6+",W:2,Ld:"9+",OC:1}, wpn:{name:"Arco-flails",A:5,BS:"4+",S:5,AP:-1,D:1}, abilities:["Acts of Faith","Arco-frenzy","Mindlock"], keywords:["Infantry","Arco-flagellants"] },
      { name:"Dominion Squad", role:"Elites", stats:{M:"6\"",T:3,Sv:"3+",W:1,Ld:"6+",OC:2}, wpn:{name:"Boltgun",A:2,BS:"3+",S:4,AP:0,D:1}, abilities:["Acts of Faith","Vanguard"], keywords:["Infantry","Dominion"] },
      { name:"Retributor Squad", role:"Heavy Support", stats:{M:"6\"",T:3,Sv:"3+",W:1,Ld:"6+",OC:2}, wpn:{name:"Multi-melta",A:2,BS:"3+",S:9,AP:-4,D:"D6"}, abilities:["Acts of Faith","Endless Crusade"], keywords:["Infantry","Retributors"] },
      { name:"Exorcist", role:"Heavy Support", stats:{M:"10\"",T:9,Sv:"3+",W:11,Ld:"7+",OC:3}, wpn:{name:"Exorcist Missile Launcher",A:"D6+3",BS:"3+",S:8,AP:-2,D:"D6"}, abilities:["Acts of Faith","Grinding Advance"], keywords:["Vehicle","Exorcist"] },
      { name:"Castigator", role:"Heavy Support", stats:{M:"10\"",T:10,Sv:"3+",W:13,Ld:"7+",OC:3}, wpn:{name:"Castigator Bolt Cannon",A:18,BS:"3+",S:5,AP:-1,D:1}, abilities:["Acts of Faith","Grinding Advance","Deadly Demise D3"], keywords:["Vehicle","Castigator"] },
      { name:"Penitent Engines", role:"Fast Attack", stats:{M:"9\"",T:6,Sv:"4+",W:5,Ld:"8+",OC:2}, wpn:{name:"Penitent Buzz-blade",A:4,BS:"3+",S:6,AP:-3,D:2}, abilities:["Acts of Faith","Vessel of Redemption","Frenzied Rampage"], keywords:["Vehicle","Walker","Penitent Engines"] },
      { name:"Mortifiers", role:"Heavy Support", stats:{M:"9\"",T:6,Sv:"4+",W:5,Ld:"8+",OC:2}, wpn:{name:"Penitent Buzz-blade",A:4,BS:"3+",S:6,AP:-3,D:2}, abilities:["Acts of Faith","Mortified Anguish"], keywords:["Vehicle","Walker","Mortifiers"] },
      { name:"Paragon Warsuits", role:"Elites", stats:{M:"8\"",T:6,Sv:"2+",W:4,Ld:"6+",OC:2}, wpn:{name:"Multi-melta",A:2,BS:"2+",S:9,AP:-4,D:"D6"}, abilities:["Acts of Faith","Paragons of Faith"], keywords:["Vehicle","Walker","Paragon Warsuits"] },
    ]},
  orks:{
    name:"Orks", short:"Orks", icon:"💀",
    color:"#3a6a1a", accent:"#8bc34a",
    detachments:[
      { name:"Waaagh! Tribe", rule:"WAAAGH!",
        desc:"Once per game, at the start of any of your Command phases, you can call a WAAAGH! Until the start of your next Command phase, add 1 to the Attacks of all Ork Infantry and Mounted models.",
        strats:[
          { name:"Mob Up", cp:1, when:"Before a unit fights", effect:"Add D3 to the Attacks of each model in the unit until end of phase." },
          { name:"Kunnin' But Brutal", cp:2, when:"Before a unit shoots", effect:"That unit ignores cover and its weapons gain AP-1 until end of phase." },
          { name:"Get Stuck In, Ladz!", cp:1, when:"When an enemy unit is destroyed by an Ork unit in melee", effect:"That Ork unit can immediately make a 3\" Consolidation move." },
        ]},
      { name:"Green Tide", rule:"Endless Green Horde",
        desc:"Once per battle, at the end of your Movement phase, you can return D6 destroyed models to a Boyz or Gretchin unit within 6\" of a friendly Warboss.",
        strats:[
          { name:"Overwhelming Numbers", cp:1, when:"Start of the Fight phase", effect:"Until end of phase, each Ork Infantry unit in Engagement Range of 2+ enemy units gets +1 Attack." },
          { name:"Rampage!", cp:2, when:"When an Ork unit charges", effect:"That unit gets +2 Strength and +1 Attack until end of Fight phase." },
        ]},
    ],
    units:[
      // Characters
      { name:"Warboss", role:"Character", stats:{M:"5\"",T:6,Sv:"3+",W:6,Ld:"6+",OC:1}, wpn:{name:"Kustom Shoota",A:4,BS:"5+",S:4,AP:0,D:1}, abilities:["Waaagh!","Brutal but Kunnin","'Ere We Go"], keywords:["Infantry","Character","Warboss"] },
      { name:"Ghazghkull Thraka", role:"Epic Hero", stats:{M:"6\"",T:9,Sv:"2+",W:12,Ld:"5+",OC:5}, wpn:{name:"Gork's Klaw",A:5,BS:"3+",S:14,AP:-4,D:"D6+2"}, abilities:["Waaagh!","Prophet of Da Great Waaagh!","I Am Da Greatest"], keywords:["Infantry","Character","Epic Hero","Warboss","Ghazghkull Thraka"] },
      { name:"Big Mek with Shokk Attack Gun", role:"Character", stats:{M:"5\"",T:5,Sv:"4+",W:5,Ld:"7+",OC:1}, wpn:{name:"Shokk Attack Gun",A:"D3+3",BS:"5+",S:"2D6",AP:-5,D:"D6"}, abilities:["Waaagh!","Mekboy","Mekaniak"], keywords:["Infantry","Character","Big Mek"] },
      { name:"Warboss on Warbike", role:"Character", stats:{M:"14\"",T:7,Sv:"4+",W:7,Ld:"6+",OC:2}, wpn:{name:"Dakkaguns",A:4,BS:"5+",S:5,AP:0,D:1}, abilities:["Waaagh!","Full Throttle","Brutal but Kunnin"], keywords:["Mounted","Character","Warboss"] },
      { name:"Weirdboy", role:"Character", stats:{M:"5\"",T:5,Sv:"6+",W:4,Ld:"8+",OC:1}, wpn:{name:"Weirdboy Staff",A:3,BS:"5+",S:6,AP:-1,D:2}, abilities:["Waaagh!","Psyker","Da Jump"], keywords:["Infantry","Character","Psyker","Weirdboy"] },
      // Battleline
      { name:"Boyz", role:"Battleline", stats:{M:"5\"",T:5,Sv:"6+",W:1,Ld:"8+",OC:2}, wpn:{name:"Choppa",A:2,BS:"5+",S:4,AP:-1,D:1}, abilities:["Waaagh!","'Ere We Go","Mob Rule"], keywords:["Infantry","Battleline","Mob","Boyz"] },
      { name:"Gretchin", role:"Battleline", stats:{M:"5\"",T:2,Sv:"6+",W:1,Ld:"9+",OC:1}, wpn:{name:"Grot Blasta",A:1,BS:"5+",S:3,AP:0,D:1}, abilities:["Waaagh!","Grots"], keywords:["Infantry","Battleline","Grots","Gretchin"] },
      // Other
      { name:"Nobz", role:"Elites", stats:{M:"5\"",T:5,Sv:"4+",W:3,Ld:"7+",OC:1}, wpn:{name:"Power Klaw",A:3,BS:"5+",S:8,AP:-2,D:2}, abilities:["Waaagh!","'Ere We Go","Nobz"], keywords:["Infantry","Mob","Nobz"] },
      { name:"Megaboss Nobz", role:"Elites", stats:{M:"5\"",T:6,Sv:"2+",W:3,Ld:"7+",OC:1}, wpn:{name:"Power Klaw",A:3,BS:"5+",S:8,AP:-2,D:2}, abilities:["Waaagh!","'Ere We Go","Meganobz"], keywords:["Infantry","Mob","Meganobz"] },
      { name:"Kommandos", role:"Elites", stats:{M:"6\"",T:5,Sv:"6+",W:2,Ld:"8+",OC:2}, wpn:{name:"Choppa",A:2,BS:"3+",S:4,AP:-1,D:1}, abilities:["Waaagh!","Infiltrators","Sneaky Gits"], keywords:["Infantry","Kommandos"] },
      { name:"Stormboyz", role:"Fast Attack", stats:{M:"12\"",T:5,Sv:"6+",W:1,Ld:"8+",OC:1}, wpn:{name:"Slugga",A:1,BS:"5+",S:4,AP:0,D:1}, abilities:["Waaagh!","'Ere We Go","Aerial Assault"], keywords:["Infantry","Jump Pack","Stormboyz"] },
      { name:"Warbikers", role:"Fast Attack", stats:{M:"14\"",T:6,Sv:"4+",W:2,Ld:"8+",OC:2}, wpn:{name:"Dakkaguns",A:2,BS:"5+",S:5,AP:0,D:1}, abilities:["Waaagh!","'Ere We Go","Drive-by Dakka"], keywords:["Mounted","Mob","Warbikers"] },
      { name:"Beast Snagga Boyz", role:"Fast Attack", stats:{M:"6\"",T:5,Sv:"6+",W:2,Ld:"8+",OC:2}, wpn:{name:"Power Snappa",A:2,BS:"5+",S:7,AP:-1,D:1}, abilities:["Waaagh!","'Ere We Go","Dat One's Even Bigga!"], keywords:["Infantry","Mob","Beast Snagga Boyz"] },
      { name:"Deff Dread", role:"Heavy Support", stats:{M:"6\"",T:8,Sv:"3+",W:8,Ld:"7+",OC:3}, wpn:{name:"Dread Klaw",A:4,BS:"5+",S:10,AP:-2,D:3}, abilities:["Waaagh!","'Ere We Go","Deadly Demise D3"], keywords:["Vehicle","Walker","Deff Dread"] },
      { name:"Mek Gunz", role:"Heavy Support", stats:{M:"3\"",T:5,Sv:"4+",W:4,Ld:"8+",OC:2}, wpn:{name:"Kustom Mega-kannon",A:"D3",BS:"5+",S:8,AP:-3,D:"D3+3"}, abilities:["Waaagh!","Krew-served"], keywords:["Infantry","Mek Gunz"] },
      { name:"Battlewagon", role:"Transport", stats:{M:"10\"",T:10,Sv:"3+",W:13,Ld:"7+",OC:4}, wpn:{name:"Deff Rolla",A:4,BS:"5+",S:9,AP:-1,D:2}, abilities:["Waaagh!","Ramming Speed","Transport"], keywords:["Vehicle","Transport","Battlewagon"] },
      { name:"Trukk", role:"Transport", stats:{M:"12\"",T:8,Sv:"4+",W:8,Ld:"8+",OC:2}, wpn:{name:"Big Shoota",A:3,BS:"5+",S:5,AP:0,D:1}, abilities:["Waaagh!","Ramshackle","Transport"], keywords:["Vehicle","Transport","Trukk"] },
    ]},
  necrons:{
    name:"Necrons", short:"Necrons", icon:"☠️",
    color:"#006060", accent:"#00e5cc",
    detachments:[
      { name:"Awakened Dynasty", rule:"Eternal Conquerors",
        desc:"At the start of each of your Command phases, each Necron unit gains 1 Command Protocol token. Spend it to activate a protocol bonus based on the active protocol type.",
        strats:[
          { name:"Adaptive Strategy", cp:1, when:"Your Command phase", effect:"One unit immediately benefits from two Command Protocol bonuses instead of one." },
          { name:"Reanimation Override", cp:2, when:"Start of your Command phase", effect:"One unit automatically passes its Reanimation Protocol roll without rolling." },
          { name:"Quantum Deflection", cp:1, when:"When a unit is targeted", effect:"Until end of phase, models in that unit have a 5+ invulnerable save." },
        ]},
      { name:"Hypercrypt Legion", rule:"Dimensional Corridor",
        desc:"At the end of your opponent's turn, you may remove one Necron Infantry unit from the battlefield into Strategic Reserves. It can arrive anywhere more than 9\" from all enemy models at the start of your next Movement phase.",
        strats:[
          { name:"Hyperphasic Bleed", cp:1, when:"Before a unit shoots", effect:"Until end of phase, the unit's weapons gain Devastating Wounds." },
          { name:"Spectral Form", cp:2, when:"When a unit is chosen as a target", effect:"Until end of phase, that unit ignores all AP modifiers." },
        ]},
    ],
    units:[
      { name:"Necron Warriors", role:"Troops", stats:{M:"5\"",T:4,Sv:"4+",W:1,Ld:"7+",OC:1}, wpn:{name:"Gauss Flayer",A:1,BS:"4+",S:4,AP:0,D:1}, abilities:["Reanimation Protocols","Living Metal"], keywords:["Infantry","Necron Warriors"] },
      { name:"Immortals", role:"Troops", stats:{M:"5\"",T:4,Sv:"3+",W:1,Ld:"7+",OC:2}, wpn:{name:"Gauss Blaster",A:2,BS:"3+",S:5,AP:-2,D:1}, abilities:["Reanimation Protocols","Living Metal"], keywords:["Infantry","Immortals"] },
      { name:"Overlord", role:"HQ", stats:{M:"5\"",T:5,Sv:"3+",W:6,Ld:"6+",OC:1}, wpn:{name:"Tachyon Arrow",A:1,BS:"2+",S:16,AP:-5,D:"D6+2"}, abilities:["Reanimation Protocols","Resurrection Orb","Independent Character"], keywords:["Infantry","Character","Overlord"] },
      { name:"Lychguard", role:"Elites", stats:{M:"5\"",T:5,Sv:"3+",W:2,Ld:"7+",OC:1}, wpn:{name:"Warscythe",A:3,BS:"3+",S:7,AP:-2,D:2}, abilities:["Reanimation Protocols","Dispersion Shield"], keywords:["Infantry","Lychguard"] },
      { name:"Doomsday Ark", role:"Heavy Support", stats:{M:"10\"",T:9,Sv:"3+",W:12,Ld:"7+",OC:4}, wpn:{name:"Doomsday Cannon",A:1,BS:"3+",S:16,AP:-5,D:"D6+6"}, abilities:["Reanimation Protocols","Living Metal","Quantum Shielding"], keywords:["Vehicle","Doomsday Ark"] },
    ]},
  tyranids:{
    name:"Tyranids", short:"Tyranids", icon:"🦷",
    color:"#5a0070", accent:"#da70d6",
    detachments:[
      { name:"Invasion Fleet", rule:"Synaptic Imperative",
        desc:"At the start of your Command phase, choose one Imperative: Aggressive Surge (+1 Attacks to Synapse units), Feeding Frenzy (re-roll 1s to hit for non-Synapse units), or Bounding Advance (all units can Advance and still charge that turn).",
        strats:[
          { name:"Spawning Surge", cp:1, when:"End of your Movement phase", effect:"Return D3 Termagants or Hormagaunts to a unit within 12\" of a friendly Tervigon." },
          { name:"Voracious Appetite", cp:2, when:"Before a unit fights", effect:"Until end of Fight phase, that unit's melee weapons gain Lethal Hits." },
          { name:"Shadow in the Warp", cp:1, when:"When an enemy uses a Stratagem", effect:"Roll a D6; on a 4+, that Stratagem fails with no effect." },
        ]},
      { name:"Crusher Stampede", rule:"Living Battering Ram",
        desc:"Each time a Monster unit charges, it gains +2 Strength and +1 Attack until end of Fight phase. If it charged into 2+ enemy units, it also gains Devastating Wounds.",
        strats:[
          { name:"Rending Claws", cp:1, when:"Before a Monster fights", effect:"Until end of phase, that model's weapons have AP improved by 1." },
          { name:"Feeding the Swarm", cp:2, when:"When a Monster destroys a unit in melee", effect:"It immediately regenerates D3 wounds." },
        ]},
    ],
    units:[
      { name:"Hormagaunts", role:"Troops", stats:{M:"8\"",T:3,Sv:"6+",W:1,Ld:"8+",OC:2}, wpn:{name:"Hormagaunt Talons",A:3,BS:"4+",S:3,AP:0,D:1}, abilities:["Synapse","Instinctive Behaviour"], keywords:["Infantry","Hormagaunts"] },
      { name:"Termagants", role:"Troops", stats:{M:"6\"",T:3,Sv:"6+",W:1,Ld:"8+",OC:1}, wpn:{name:"Fleshborer",A:1,BS:"4+",S:5,AP:0,D:1}, abilities:["Synapse","Instinctive Behaviour"], keywords:["Infantry","Termagants"] },
      { name:"Hive Tyrant", role:"HQ", stats:{M:"10\"",T:9,Sv:"2+",W:12,Ld:"6+",OC:3}, wpn:{name:"Monstrous Rending Claws",A:5,BS:"4+",S:12,AP:-3,D:3}, abilities:["Synapse","Shadow in the Warp","Independent Character"], keywords:["Monster","Character","Hive Tyrant"] },
      { name:"Carnifex", role:"Heavy Support", stats:{M:"8\"",T:9,Sv:"2+",W:9,Ld:"8+",OC:3}, wpn:{name:"Bio-Plasma",A:2,BS:"4+",S:8,AP:-3,D:"D6"}, abilities:["Synapse","Living Battering Ram"], keywords:["Monster","Carnifex"] },
      { name:"Lictor", role:"Elites", stats:{M:"9\"",T:5,Sv:"4+",W:5,Ld:"8+",OC:1}, wpn:{name:"Rending Claws",A:5,BS:"3+",S:6,AP:-2,D:2}, abilities:["Synapse","Pheromone Trail","Chameleonic Skin"], keywords:["Infantry","Lictor"] },
    ]},
  darkangels:{
    name:"Dark Angels", short:"Dark Angels", icon:"🗡️",
    color:"#0a3a0a", accent:"#5aaa5a",
    detachments:[
      { name:"Unforgiven Task Force", rule:"Grim Resolve",
        desc:"Friendly Dark Angels units never take Battle-shock tests. Each time an enemy targets a Dark Angels unit that did not move in the preceding Movement phase, models in that unit have a 5+ Feel No Pain save.",
        strats:[
          { name:"Inner Circle", cp:1, when:"Before a Deathwing or Ravenwing unit fights", effect:"That unit gets +1 to all Wound rolls this phase." },
          { name:"Interrogator's Wisdom", cp:1, when:"Command phase", effect:"One Character gains an extra 2CP that can only be spent on Stratagems affecting their unit." },
          { name:"Wings of Judgement", cp:2, when:"When a Ravenwing unit finishes a charge", effect:"Until end of Fight phase, that unit's weapons gain Sustained Hits 1." },
        ]},
      { name:"Deathwing Brotherhood", rule:"Rites of Battle",
        desc:"Deathwing units gain +1 to Hit rolls when targeting units in cover. Once per battle round, a Deathwing unit can re-roll its charge roll.",
        strats:[
          { name:"Teleport Strike", cp:1, when:"End of your Movement phase", effect:"Remove one Deathwing unit and redeploy it anywhere more than 9\" from enemy models." },
          { name:"Deathwing Assault", cp:2, when:"Before Terminators fight", effect:"Until end of phase, each model makes 1 additional attack per 2 enemy models within 3\"." },
        ]},
    ],
    units:[
      { name:"Intercessors", role:"Troops", stats:{M:"6\"",T:4,Sv:"3+",W:2,Ld:"6+",OC:2}, wpn:{name:"Bolt Rifle",A:2,BS:"3+",S:4,AP:-1,D:1}, abilities:["Oath of Moment","Adeptus Astartes"], keywords:["Infantry","Primaris","Intercessors"] },
      { name:"Deathwing Terminators", role:"Elites", stats:{M:"5\"",T:5,Sv:"2+",W:3,Ld:"6+",OC:1}, wpn:{name:"Storm Bolter",A:2,BS:"3+",S:4,AP:0,D:1}, abilities:["Oath of Moment","Teleport Strike","Inner Circle"], keywords:["Infantry","Terminator","Deathwing"] },
      { name:"Ravenwing Black Knights", role:"Fast Attack", stats:{M:"14\"",T:5,Sv:"3+",W:3,Ld:"6+",OC:2}, wpn:{name:"Corvus Hammer",A:3,BS:"3+",S:5,AP:-2,D:2}, abilities:["Oath of Moment","Jink","Ravenwing"], keywords:["Mounted","Ravenwing","Black Knights"] },
      { name:"Azrael", role:"HQ", stats:{M:"6\"",T:4,Sv:"2+",W:6,Ld:"5+",OC:1}, wpn:{name:"The Lion's Wrath",A:3,BS:"2+",S:4,AP:-1,D:2}, abilities:["Oath of Moment","Supreme Grand Master","Rites of Battle","Independent Character"], keywords:["Infantry","Character","Azrael"] },
      { name:"Predator Annihilator", role:"Heavy Support", stats:{M:"10\"",T:9,Sv:"3+",W:11,Ld:"6+",OC:3}, wpn:{name:"Twin Lascannon",A:2,BS:"3+",S:12,AP:-3,D:"D6+1"}, abilities:["Oath of Moment","Smoke","Deadly Demise D3"], keywords:["Vehicle","Predator"] },
    ]},
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMBAT INTERACTION DATA
// Pedagogically designed: 1 correct answer + 3 plausible distractors
// ═══════════════════════════════════════════════════════════════════════════════
function getWoundRoll(s,t){ if(s>=t*2)return"2+"; if(s>t)return"3+"; if(s===t)return"4+"; if(s*2>t)return"5+"; return"6+"; }

const WOUND_QS = [
  // each: S, T, wrong options chosen to be the adjacent rolls (common confusion)
  [4,3,"3+","2+","5+","6+"],
  [4,4,"4+","3+","5+","6+"],
  [6,4,"3+","2+","4+","5+"],
  [8,4,"2+","3+","4+","5+"],
  [3,4,"5+","4+","6+","3+"],
  [3,6,"6+","5+","4+","3+"],
  [5,5,"4+","3+","5+","6+"],
  [10,5,"2+","3+","4+","5+"],
  [6,6,"4+","3+","5+","6+"],
  [4,8,"6+","5+","4+","3+"],
  [7,4,"3+","2+","4+","5+"],
  [2,5,"6+","5+","4+","3+"],
].map(([s,t,...wrong])=>{
  const correct = getWoundRoll(s,t);
  const opts = shuffle([correct,...wrong.filter(w=>w!==correct).slice(0,3)]);
  const why = correct==="2+"?`S(${s}) ≥ 2×T = ${t*2}`:correct==="3+"?`S(${s}) > T(${t})`:correct==="4+"?`S(${s}) = T(${t})`:correct==="5+"?`S(${s}) < T(${t}) but S×2(${s*2}) > T`:`S(${s}) × 2 = ${s*2} ≤ T(${t})`;
  return { type:"wound", tag:"🗡️ WOUND ROLL", q:`Weapon Strength ${s} attacks Toughness ${t}. What roll is needed to wound?`, opts, correct:opts.indexOf(correct), explanation:`${why} → wound on ${correct}.` };
});

const SAVE_QS = [
  // [ap, sv, result, wrong1, wrong2, wrong3] — wrongs are adjacent values or common confusions
  [0,"4+","4+","3+","5+","No save"],
  [-1,"4+","5+","4+","6+","3+"],
  [-2,"4+","6+","5+","4+","No save"],
  [-1,"3+","4+","3+","5+","6+"],
  [-2,"3+","5+","3+","4+","6+"],
  [-3,"3+","6+","5+","4+","No save"],
  [-4,"3+","No save","6+","7+","5+"],
  [-1,"2+","3+","2+","4+","5+"],
  [-3,"4+","No save","6+","5+","7+"],
  [0,"6+","6+","5+","No save","4+"],
  [-5,"2+","No save","6+","5+","7+"],
  [-2,"5+","No save","6+","5+","7+"],
].map(([ap,sv,result,...wrong])=>{
  const opts = shuffle([result,...wrong.filter(w=>w!==result).slice(0,3)]);
  const apN = Math.abs(Number(ap)); const svN = parseInt(sv);
  return { type:"save", tag:"🛡️ SAVE ROLL", q:`AP${ap} hits a ${sv} armour save. What does the defender roll?`, opts, correct:opts.indexOf(result), explanation: result==="No save"?`AP${ap} reduces ${sv} by ${apN}. ${svN}+${apN}=${svN+apN}+ is impossible — no save.`:`AP${ap} worsens ${sv} by ${apN}. ${svN}+${apN} = ${result}.` };
});

const HIT_QS = [
  // [bs, shots, correct, wrong1, wrong2, wrong3] — wrongs are nearby values
  [2,3,"~3","~2","~1","All 3"],
  [3,3,"~2","~3","~1","All 3"],
  [4,4,"~2","~3","~1","All 4"],
  [5,3,"~1","~2","~3","0"],
  [3,6,"~4","~3","~5","~2"],
  [2,4,"~3","~4","~2","All 4"],
  [4,6,"~3","~4","~2","~5"],
  [5,6,"~2","~3","~1","~4"],
  [3,4,"~3","~4","~2","~1"],
].map(([bs,shots,correct,...wrong])=>{
  const opts = shuffle([correct,...wrong.filter(w=>w!==correct).slice(0,3)]);
  const pct = Math.round((7-bs)/6*100);
  return { type:"hit", tag:"🎯 HIT PROBABILITY", q:`A model with BS${bs}+ fires ${shots} shots. Approximately how many hits on average?`, opts, correct:opts.indexOf(correct), explanation:`BS${bs}+ hits on a ${bs} or higher = ${pct}% chance per shot. ${shots} × ${pct}% ≈ ${(shots*(7-bs)/6).toFixed(1)} hits.` };
});

// Interaction edge-case questions — pedagogically rich
const INTERACTION_QS = [
  {
    type:"interaction", tag:"⚠️ EDGE CASE",
    q:"A weapon has Damage 3 and the target has 2 Wounds. How much damage does the model actually suffer?",
    opts:["3 — full damage is always applied","2 — damage is capped at the model's remaining wounds","1 — excess damage is halved","3 — but the excess 1 spills to the next model"],
    correct:1,
    explanation:"Damage is capped at the target model's remaining wounds. A model with 2W cannot suffer more than 2 damage — excess damage is lost (not transferred to adjacent models, unless a special rule says otherwise)."
  },
  {
    type:"interaction", tag:"⚠️ EDGE CASE",
    q:"A unit has 5 models. It started with 10. Is it below Half-strength?",
    opts:["No — it has exactly half its models remaining","Yes — below half-strength means fewer than half","Yes — once any models are lost it is considered weakened","No — below half-strength only triggers when 3 or fewer remain"],
    correct:0,
    explanation:"Half-strength is defined as having lost MORE than half the starting models. 5 of 10 = exactly half — the unit is NOT below half-strength. It needs to be reduced to 4 or fewer models to be below half-strength."
  },
  {
    type:"interaction", tag:"⚠️ EDGE CASE",
    q:"A unit with 5+ Feel No Pain suffers a mortal wound. How many FNP rolls are made?",
    opts:["1 roll — mortal wounds bypass FNP","1 roll — mortal wounds deal 1 damage so 1 FNP roll","0 rolls — mortal wounds ignore all saves and special saves","1 roll per point of damage, same as regular wounds"],
    correct:1,
    explanation:"Feel No Pain can be used against mortal wounds. Each mortal wound inflicts 1 damage, so 1 FNP roll is made per mortal wound. The FNP only fails to apply if the rule specifically says it can't be used against mortal wounds."
  },
  {
    type:"interaction", tag:"⚠️ EDGE CASE",
    q:"A unit Falls Back. What restrictions apply for the rest of that turn?",
    opts:["It cannot move again but can shoot and charge normally","It cannot shoot or charge that turn (unless special rules apply)","It cannot be targeted by enemy Stratagems","It must take a Battle-shock test immediately"],
    correct:1,
    explanation:"A unit that Falls Back cannot shoot or charge that same turn. It can still be targeted normally. No Battle-shock test is triggered by falling back. Some units have special rules that let them shoot after falling back."
  },
  {
    type:"interaction", tag:"⚠️ EDGE CASE",
    q:"Both players want to use abilities at the same time at the END of a Battle Round. Who decides the order?",
    opts:["The player who has the initiative (first player) decides","The player who is losing on victory points decides","Players roll off — winner decides the order","The active player decides"],
    correct:2,
    explanation:"When two rules trigger simultaneously at the start OR end of a battle round (not during a specific player's turn), the players roll off to see who decides the resolution order. During a player's turn, the active player always decides."
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function StatPip({ label, value, accent="#e0d5c5" }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",background:"#0a0a12",border:`1px solid ${accent}33`,borderRadius:6,padding:"6px 10px",minWidth:46}}>
      <span style={{color:"#555",fontSize:9,letterSpacing:2,fontFamily:"'Cinzel',serif",textTransform:"uppercase"}}>{label}</span>
      <span style={{color:accent,fontSize:18,fontWeight:700,fontFamily:"'Cinzel',serif",lineHeight:1.2}}>{value}</span>
    </div>
  );
}

function BackBtn({ onClick, label="← BACK" }) {
  return (
    <button onClick={onClick} style={{background:"none",border:"1px solid #252535",borderRadius:6,padding:"7px 14px",color:"#555",fontSize:10,letterSpacing:2,cursor:"pointer",fontFamily:"'Cinzel',serif",marginBottom:16,display:"inline-block"}}>
      {label}
    </button>
  );
}

function SectionHead({ title, sub, accent="#dc143c" }) {
  return (
    <div style={{marginBottom:18}}>
      <div style={{fontSize:9,color:accent,letterSpacing:3,fontFamily:"'Cinzel',serif",marginBottom:3}}>◆ {sub} ◆</div>
      <div style={{fontSize:20,fontWeight:700,color:"#e0d5c5",fontFamily:"'Cinzel Decorative',serif",lineHeight:1.2}}>{title}</div>
    </div>
  );
}

function PBar({ v, max, color="#dc143c" }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
      <div style={{flex:1,height:4,background:"#1a1a2a",borderRadius:2,overflow:"hidden"}}>
        <div style={{width:`${Math.min((v/max)*100,100)}%`,height:"100%",background:color,borderRadius:2,transition:"width 0.3s"}} />
      </div>
      <span style={{fontSize:10,color:"#555",fontFamily:"'Cinzel',serif",minWidth:36,textAlign:"right"}}>{v}/{max}</span>
    </div>
  );
}

function MenuRow({ icon, label, sublabel, accent="#e0d5c5", borderCol="#252535", onClick }) {
  return (
    <button onClick={onClick} style={{background:"#0d0d1a",border:`1px solid ${borderCol}`,borderRadius:10,padding:"14px 16px",display:"flex",alignItems:"center",gap:13,cursor:"pointer",transition:"all 0.2s",textAlign:"left",width:"100%",marginBottom:9}}>
      <span style={{fontSize:22,width:28,textAlign:"center",flexShrink:0}}>{icon}</span>
      <div style={{flex:1}}>
        <div style={{color:accent,fontFamily:"'Cinzel',serif",fontSize:13,marginBottom:2}}>{label}</div>
        {sublabel && <div style={{color:"#555",fontSize:11,fontFamily:"'Crimson Pro',serif"}}>{sublabel}</div>}
      </div>
      <span style={{color:"#333",fontSize:18,flexShrink:0}}>›</span>
    </button>
  );
}

// The core quiz component — handles flashcard flip or multiple choice
function ChoiceBtn({ text, roman, state, onClick }) {
  const S = {
    default: { bg:"#0d0d1a", border:"#252535", col:"#b0a890", icon:null },
    correct: { bg:"#061506", border:"#256a25", col:"#7dda7d", icon:"✓" },
    wrong:   { bg:"#150606", border:"#6a2525", col:"#dd7d7d", icon:"✗" },
    dim:     { bg:"#0d0d1a", border:"#181828", col:"#444",    icon:null },
  };
  const s = S[state||"default"];
  return (
    <button onClick={onClick} style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:8,padding:"11px 14px",textAlign:"left",cursor:state&&state!=="default"?"default":"pointer",color:s.col,fontSize:13,lineHeight:1.5,transition:"all 0.18s",fontFamily:"'Crimson Pro',serif",width:"100%",display:"flex",gap:10,alignItems:"flex-start"}}>
      <span style={{color:"#555",fontFamily:"'Cinzel',serif",fontSize:10,minWidth:18,paddingTop:2,flexShrink:0}}>{roman}.</span>
      <span style={{flex:1}}>{text}</span>
      {s.icon && <span style={{flexShrink:0,fontWeight:700}}>{s.icon}</span>}
    </button>
  );
}

// QuizMounted — shuffles the question order ONCE into useState (runs on mount only,
// never again). Passes the stable frozen array to QuizEngine which never shuffles.
function QuizMounted({ raw, ...props }) {
  const [questions] = useState(() => shuffle(raw));
  return <QuizEngine questions={questions} {...props} />;
}

// Universal quiz engine — receives questions already in final order, never re-shuffles them
function QuizEngine({ questions, color, onXP, onBack, title, mistakeFocus=false }) {
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState([]);

  if (!questions.length) return <div style={{textAlign:"center",padding:40,color:"#555"}}>No questions available.</div>;

  if (idx >= questions.length) {
    const pct = Math.round(score/questions.length*100);
    const grade = pct>=90?"Master Tactician":pct>=70?"Competent Commander":pct>=50?"Learning Soldier":"Needs More Drilling";
    return (
      <div style={{padding:"20px 0"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:44,marginBottom:8}}>🎖️</div>
          <div style={{fontSize:18,fontFamily:"'Cinzel Decorative',serif",color,marginBottom:6}}>{title}</div>
          <div style={{fontSize:34,fontFamily:"'Cinzel',serif",color:pct>=70?"#7dda7d":"#dd7d7d",marginBottom:4}}>{score}/{questions.length}</div>
          <div style={{color:"#888",fontSize:12,fontFamily:"'Crimson Pro',serif",marginBottom:16}}>{grade}</div>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={onBack} style={{background:"#0d0d1a",border:`1px solid ${color}55`,borderRadius:8,padding:"10px 18px",color,fontSize:10,letterSpacing:2,cursor:"pointer",fontFamily:"'Cinzel',serif"}}>DONE</button>
            <button onClick={()=>{setSel(null);setIdx(0);setScore(0);setMistakes([]);}} style={{background:`${color}18`,border:`1px solid ${color}88`,borderRadius:8,padding:"10px 18px",color,fontSize:10,letterSpacing:2,cursor:"pointer",fontFamily:"'Cinzel',serif"}}>RETRY ALL</button>
          </div>
        </div>
        {mistakes.length > 0 && (
          <div style={{background:"#0d0a0a",border:"1px solid #3a1a1a",borderRadius:10,padding:14}}>
            <div style={{fontSize:10,color:"#dd7d7d",letterSpacing:2,fontFamily:"'Cinzel',serif",marginBottom:10}}>REVIEW THESE MISTAKES</div>
            {mistakes.map((m,i)=>(
              <div key={i} style={{borderBottom:"1px solid #1a1a1a",paddingBottom:10,marginBottom:10}}>
                <div style={{fontSize:12,color:"#c0b5a0",fontFamily:"'Crimson Pro',serif",marginBottom:4,lineHeight:1.5}}>{m.q}</div>
                <div style={{fontSize:11,color:"#5aaa5a",fontFamily:"'Crimson Pro',serif",lineHeight:1.5}}>✓ {m.opts[m.correct]}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const answered = sel !== null;

  function pick(i) {
    if (answered) return;
    setSel(i);
    if (i === questions[idx].correct) { onXP(mistakeFocus?30:20); setScore(s=>s+1); }
    else setMistakes(m=>[...m, questions[idx]]);
  }

  return (
    <div>
      <BackBtn onClick={onBack} />
      <PBar v={idx+1} max={questions.length} color={color} />
      <div style={{background:"#0d0d1a",border:`1px solid ${color}33`,borderRadius:12,padding:18,marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:4}}>
          {questions[idx].tag && <span style={{fontSize:9,color:questions[idx].tag.includes("MISTAKE")?"#f0a020":color,letterSpacing:2,fontFamily:"'Cinzel',serif",padding:"2px 8px",background:questions[idx].tag.includes("MISTAKE")?"#1a0e00":"transparent",borderRadius:4,border:questions[idx].tag.includes("MISTAKE")?"1px solid #3a2a00":"none"}}>{questions[idx].tag}</span>}
          {questions[idx].cat && <span style={{fontSize:9,color:"#555",fontFamily:"'Cinzel',serif",letterSpacing:1}}>{questions[idx].cat}</span>}
        </div>
        <div style={{fontSize:15,color:"#e0d5c5",lineHeight:1.75,fontFamily:"'Crimson Pro',serif"}}>{questions[idx].q}</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:10}}>
        {questions[idx].opts.map((opt,i)=>(
          <ChoiceBtn key={i} text={opt} roman={["I","II","III","IV"][i]} onClick={()=>pick(i)}
            state={!answered?"default":i===questions[idx].correct?"correct":i===sel?"wrong":"dim"} />
        ))}
      </div>
      {answered && (
        <>
          <div style={{background:"#050d05",border:"1px solid #1a4a1a",borderRadius:8,padding:"11px 14px",marginBottom:10,fontSize:13,color:"#aaa",lineHeight:1.7,fontFamily:"'Crimson Pro',serif"}}>
            <span style={{color:"#5aaa5a",fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:2}}>RULING: </span>{questions[idx].explanation}
          </div>
          <button onClick={()=>{setSel(null);setIdx(i=>i+1);}} style={{width:"100%",background:"#0a0a14",border:`1px solid ${color}44`,borderRadius:8,padding:12,color,fontSize:10,letterSpacing:2,cursor:"pointer",fontFamily:"'Cinzel',serif"}}>
            NEXT QUESTION →
          </button>
        </>
      )}
    </div>
  );
}

// Flashcard deck
function FlashDeck({ cards, color, onXP, onBack }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [deck] = useState(() => shuffle(cards));

  if (idx >= deck.length) return (
    <div style={{textAlign:"center",padding:"28px 0"}}>
      <div style={{fontSize:40,marginBottom:10}}>✅</div>
      <div style={{fontSize:18,fontFamily:"'Cinzel Decorative',serif",color,marginBottom:12}}>Deck Complete!</div>
      <div style={{display:"flex",gap:10,justifyContent:"center"}}>
        <button onClick={onBack} style={{background:"#0d0d1a",border:`1px solid ${color}55`,borderRadius:8,padding:"10px 20px",color,fontSize:10,letterSpacing:2,cursor:"pointer",fontFamily:"'Cinzel',serif"}}>FINISH</button>
        <button onClick={()=>{setIdx(0);setFlipped(false);}} style={{background:`${color}18`,border:`1px solid ${color}88`,borderRadius:8,padding:"10px 20px",color,fontSize:10,letterSpacing:2,cursor:"pointer",fontFamily:"'Cinzel',serif"}}>RESTART</button>
      </div>
    </div>
  );

  const card = deck[idx];
  return (
    <div>
      <BackBtn onClick={onBack} />
      <PBar v={idx+1} max={deck.length} color={color} />
      <div onClick={()=>setFlipped(f=>!f)} style={{cursor:"pointer",perspective:900,marginBottom:14}}>
        <div style={{position:"relative",minHeight:210,transformStyle:"preserve-3d",transition:"transform 0.5s cubic-bezier(.4,0,.2,1)",transform:flipped?"rotateY(180deg)":"rotateY(0deg)"}}>
          <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",background:"#0d0d1a",border:`1px solid ${color}33`,borderRadius:14,padding:22,display:"flex",flexDirection:"column",justifyContent:"center"}}>
            <div style={{fontSize:9,color,letterSpacing:3,fontFamily:"'Cinzel',serif",marginBottom:10}}>◆ QUESTION ◆</div>
            <div style={{fontSize:15,color:"#e0d5c5",fontFamily:"'Crimson Pro',serif",lineHeight:1.7}}>{card.f}</div>
            <div style={{position:"absolute",bottom:12,right:14,fontSize:9,color:"#333",fontFamily:"'Cinzel',serif"}}>TAP TO REVEAL ▶</div>
          </div>
          <div style={{position:"absolute",inset:0,backfaceVisibility:"hidden",transform:"rotateY(180deg)",background:"#080d08",border:`1px solid ${color}55`,borderRadius:14,padding:22,display:"flex",flexDirection:"column",justifyContent:"center"}}>
            <div style={{fontSize:9,color,letterSpacing:3,fontFamily:"'Cinzel',serif",marginBottom:10}}>◆ ANSWER ◆</div>
            <div style={{fontSize:13,color:"#c8d8c8",fontFamily:"'Crimson Pro',serif",lineHeight:1.85,whiteSpace:"pre-line"}}>{card.b}</div>
          </div>
        </div>
      </div>
      {flipped && (
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>{setFlipped(false);setTimeout(()=>setIdx(i=>i+1),180);}} style={{flex:1,background:"#150606",border:"1px solid #5a2525",borderRadius:8,padding:11,color:"#dd7d7d",fontSize:10,letterSpacing:2,cursor:"pointer",fontFamily:"'Cinzel',serif"}}>✗ AGAIN</button>
          <button onClick={()=>{onXP(12);setFlipped(false);setTimeout(()=>setIdx(i=>i+1),180);}} style={{flex:1,background:"#051505",border:"1px solid #255a25",borderRadius:8,padding:11,color:"#7dda7d",fontSize:10,letterSpacing:2,cursor:"pointer",fontFamily:"'Cinzel',serif"}}>✓ GOT IT +12XP</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATH 1: CORE RULES
// ═══════════════════════════════════════════════════════════════════════════════
function CorePath({ onXP, onBack }) {
  const [view, setView] = useState(null);

  if (view?.type==="flash") return <FlashDeck cards={view.deck.cards} color="#5a8adc" onXP={onXP} onBack={()=>setView(null)} />;
  if (view?.type==="quiz")   return <QuizMounted raw={CORE_QUIZ}         color="#f0a020" onXP={onXP} onBack={()=>setView(null)} title="Common Mistakes Quiz" mistakeFocus />;
  if (view?.type==="mixed")  return <QuizMounted raw={CORE_QUIZ.slice(0,6)} color="#c088e0" onXP={onXP} onBack={()=>setView(null)} title="Core Rules Quiz" />;

  return (
    <div>
      <BackBtn onClick={onBack} />
      <SectionHead title="Core Rules" sub="Path I — Universal Mechanics" accent="#5a8adc" />
      <p style={{color:"#666",fontSize:13,marginBottom:18,fontFamily:"'Crimson Pro',serif",lineHeight:1.7}}>
        Rules that apply to every army in every game. Master these and you'll never argue a phase again.
      </p>

      <div style={{fontSize:10,color:"#5a8adc",letterSpacing:2,fontFamily:"'Cinzel',serif",marginBottom:10}}>FLASHCARD TOPICS</div>
      {CORE_DECKS.map(d=>(
        <MenuRow key={d.id} icon={d.icon} label={d.title} sublabel={`${d.cards.length} flashcards`} accent="#c0b5a0" borderCol="#252535" onClick={()=>setView({type:"flash",deck:d})} />
      ))}

      <div style={{fontSize:10,color:"#f0a020",letterSpacing:2,fontFamily:"'Cinzel',serif",marginBottom:10,marginTop:6}}>QUIZZES</div>
      <MenuRow icon="⚠️" label="Common Mistakes Quiz" sublabel={`${CORE_QUIZ.length} questions · real table mistakes +30XP each`} accent="#f0a020" borderCol="#3a2a00" onClick={()=>setView({type:"quiz"})} />
      <MenuRow icon="🧠" label="Core Rules Quiz" sublabel="Mixed questions from all rule topics" accent="#c088e0" borderCol="#2a1a4a" onClick={()=>setView({type:"mixed"})} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATH 2: FACTIONS
// ═══════════════════════════════════════════════════════════════════════════════
function FactionPath({ onXP, onBack }) {
  const [fKey, setFKey] = useState(null);
  const [section, setSection] = useState(null);

  if (!fKey) return (
    <div>
      <BackBtn onClick={onBack} />
      <SectionHead title="Faction Codex" sub="Path II — Choose Your Army" accent="#ffd700" />
      {Object.entries(FACTIONS).map(([key,f])=>(
        <MenuRow key={key} icon={f.icon} label={f.name} sublabel={`${f.units.length} units · ${f.detachments.length} detachments`} accent={f.accent} borderCol={f.color} onClick={()=>setFKey(key)} />
      ))}
    </div>
  );

  const f = FACTIONS[fKey];

  if (!section) return (
    <div>
      <BackBtn onClick={()=>setFKey(null)} />
      <SectionHead title={f.name} sub="Faction Training" accent={f.accent} />
      <MenuRow icon="⚙️" label="Detachments" sublabel="Rules, stratagems & detachment abilities" accent={f.accent} borderCol={f.color} onClick={()=>setSection("det")} />
      <MenuRow icon="📋" label="Unit Datasheets" sublabel="Stat lines, weapons & recall quizzes" accent={f.accent} borderCol={f.color} onClick={()=>setSection("units")} />
    </div>
  );

  if (section==="det") return <DetachmentView f={f} onXP={onXP} onBack={()=>setSection(null)} />;
  return <UnitsView f={f} onXP={onXP} onBack={()=>setSection(null)} />;
}

function DetachmentView({ f, onXP, onBack }) {
  const [det, setDet] = useState(null);
  if (!det) return (
    <div>
      <BackBtn onClick={onBack} />
      <SectionHead title="Detachments" sub={f.name} accent={f.accent} />
      {f.detachments.map((d,i)=>(
        <MenuRow key={i} icon="⚙️" label={d.name} sublabel={`Rule: ${d.rule} · ${d.strats.length} stratagems`} accent={f.accent} borderCol={f.color} onClick={()=>setDet(d)} />
      ))}
    </div>
  );
  return (
    <div>
      <BackBtn onClick={()=>setDet(null)} />
      <div style={{fontSize:9,color:f.accent,letterSpacing:3,fontFamily:"'Cinzel',serif",marginBottom:3}}>◆ DETACHMENT RULE ◆</div>
      <div style={{fontSize:19,fontWeight:700,color:"#e0d5c5",fontFamily:"'Cinzel Decorative',serif",marginBottom:14}}>{det.name}</div>
      <div style={{background:"#0d0d1a",border:`1px solid ${f.color}55`,borderRadius:12,padding:16,marginBottom:14}}>
        <div style={{color:f.accent,fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:2,marginBottom:8}}>{det.rule}</div>
        <div style={{color:"#b0a890",fontSize:13,lineHeight:1.75,fontFamily:"'Crimson Pro',serif"}}>{det.desc}</div>
      </div>
      <div style={{fontSize:10,color:"#555",letterSpacing:2,fontFamily:"'Cinzel',serif",marginBottom:10}}>STRATAGEMS</div>
      {det.strats.map((s,i)=>(
        <div key={i} style={{background:"#0a0a14",border:"1px solid #22223a",borderRadius:10,padding:"13px 15px",marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <span style={{color:"#e0d5c5",fontFamily:"'Cinzel',serif",fontSize:12}}>{s.name}</span>
            <span style={{background:`${f.color}22`,border:`1px solid ${f.color}55`,borderRadius:4,padding:"2px 9px",color:f.accent,fontSize:10,fontFamily:"'Cinzel',serif",flexShrink:0}}>{s.cp}CP</span>
          </div>
          <div style={{color:"#777",fontSize:11,fontFamily:"'Crimson Pro',serif",marginBottom:4}}><span style={{color:"#555"}}>WHEN: </span>{s.when}</div>
          <div style={{color:"#aaa",fontSize:12,lineHeight:1.6,fontFamily:"'Crimson Pro',serif"}}>{s.effect}</div>
        </div>
      ))}
    </div>
  );
}

function UnitsView({ f, onXP, onBack }) {
  const [unit, setUnit] = useState(null);
  const [mode, setMode] = useState(null);

  if (!unit) return (
    <div>
      <BackBtn onClick={onBack} />
      <SectionHead title="Unit Datasheets" sub={f.name} accent={f.accent} />
      {f.units.map((u,i)=>(
        <MenuRow key={i} icon="📋" label={u.name} sublabel={`${u.role} · T${u.stats.T} · ${u.stats.Sv} save · ${u.stats.W}W`} accent={f.accent} borderCol={f.color} onClick={()=>setUnit(u)} />
      ))}
    </div>
  );

  if (mode==="quiz") return <StatRecallQuiz unit={unit} f={f} onXP={onXP} onBack={()=>setMode(null)} />;

  return (
    <div>
      <BackBtn onClick={()=>setUnit(null)} />
      <div style={{fontSize:9,color:f.accent,letterSpacing:3,fontFamily:"'Cinzel',serif",marginBottom:3}}>◆ {unit.role.toUpperCase()} · {f.short.toUpperCase()} ◆</div>
      <div style={{fontSize:20,fontWeight:700,color:"#e0d5c5",fontFamily:"'Cinzel Decorative',serif",marginBottom:14,lineHeight:1.2}}>{unit.name}</div>

      <div style={{background:"#0d0d1a",border:`1px solid ${f.color}44`,borderRadius:12,padding:16,marginBottom:12}}>
        <div style={{fontSize:9,color:"#555",letterSpacing:2,fontFamily:"'Cinzel',serif",marginBottom:10}}>CHARACTERISTICS</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
          {Object.entries(unit.stats).map(([k,v])=><StatPip key={k} label={k} value={v} accent={f.accent} />)}
        </div>
        <div style={{background:"#080810",border:"1px solid #1a1a2a",borderRadius:8,padding:"11px 13px"}}>
          <div style={{color:f.accent,fontSize:11,fontFamily:"'Cinzel',serif",marginBottom:7,letterSpacing:1}}>{unit.wpn.name}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:14}}>
            {[["A",unit.wpn.A],["BS",unit.wpn.BS],["S",unit.wpn.S],["AP",unit.wpn.AP],["D",unit.wpn.D]].map(([k,v])=>(
              <span key={k} style={{fontSize:12,color:"#888"}}><span style={{color:"#444"}}>{k}:</span><span style={{color:"#c0b5a0",marginLeft:4}}>{v}</span></span>
            ))}
          </div>
        </div>
      </div>

      <div style={{marginBottom:12}}>
        <div style={{fontSize:9,color:"#555",letterSpacing:2,fontFamily:"'Cinzel',serif",marginBottom:8}}>ABILITIES</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {unit.abilities.map(a=><span key={a} style={{background:`${f.color}18`,border:`1px solid ${f.color}44`,borderRadius:4,padding:"3px 9px",fontSize:11,color:f.accent,fontFamily:"'Cinzel',serif"}}>{a}</span>)}
        </div>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:18}}>
        {unit.keywords.map(k=><span key={k} style={{background:"#111118",border:"1px solid #22223a",borderRadius:4,padding:"2px 7px",fontSize:10,color:"#666",fontFamily:"'Cinzel',serif"}}>{k}</span>)}
      </div>
      <button onClick={()=>setMode("quiz")} style={{width:"100%",background:`${f.color}18`,border:`1px solid ${f.color}77`,borderRadius:10,padding:14,color:f.accent,fontSize:10,letterSpacing:2,cursor:"pointer",fontFamily:"'Cinzel',serif",transition:"all 0.2s"}}>
        🎯 TEST YOUR STAT RECALL →
      </button>
    </div>
  );
}

function StatRecallQuiz({ unit, f, onXP, onBack }) {
  const STAT_LABELS = {M:"Move",T:"Toughness",Sv:"Save",W:"Wounds",Ld:"Leadership",OC:"Objective Control"};
  // Plausible distractors per stat type
  const STAT_POOLS = {
    M:["4\"","5\"","6\"","7\"","8\"","10\"","12\"","14\""],
    T:["2","3","4","5","6","7","8","9","10"],
    Sv:["2+","3+","4+","5+","6+"],
    W:["1","2","3","4","5","6","7","8","9","10","11","12"],
    Ld:["5+","6+","7+","8+","9+"],
    OC:["1","2","3","4"]
  };
  const WPN_POOLS = {
    A:["1","2","3","4","5","6","D3","D6","2D6"],
    BS:["2+","3+","4+","5+","6+"],
    S:["2","3","4","5","6","7","8","9","10","12","16"],
    AP:["0","-1","-2","-3","-4","-5"],
    D:["1","2","3","D3","D6","D6+1","D6+2","D6+6","2"]
  };

  function makeQs() {
    const qs = [];
    // Stat questions — the distractors are ADJACENT values from the same pool
    Object.entries(unit.stats).forEach(([k,v])=>{
      const correct = String(v);
      const pool = (STAT_POOLS[k]||[]).filter(x=>x!==correct);
      // Pick nearest neighbours from pool for more plausible distractors
      const correctIdx = (STAT_POOLS[k]||[]).indexOf(correct);
      const nearby = pool.filter((_,i)=>{ const pi=(STAT_POOLS[k]||[]).indexOf(pool[i]); return Math.abs(pi-correctIdx)<=2; });
      const far = pool.filter(x=>!nearby.includes(x));
      const distractors = [...shuffle(nearby).slice(0,2),...shuffle(far).slice(0,2)].slice(0,3);
      const opts = shuffle([correct,...distractors]);
      qs.push({ q:`What is the ${STAT_LABELS[k]||k} (${k}) of a ${unit.name}?`, opts, correct:opts.indexOf(correct), explanation:`${unit.name} has ${k} of ${correct}.`, tag:"📋 STAT RECALL" });
    });
    // Weapon questions — adjacent distractors
    const WKS = [["Attacks","A"],["BS","BS"],["Strength","S"],["AP","AP"],["Damage","D"]];
    const WVLS = [unit.wpn.A,unit.wpn.BS,unit.wpn.S,unit.wpn.AP,unit.wpn.D];
    WKS.forEach(([label,key],i)=>{
      const correct = String(WVLS[i]);
      const pool = (WPN_POOLS[key]||[]).filter(x=>x!==correct);
      const distractors = shuffle(pool).slice(0,3);
      const opts = shuffle([correct,...distractors]);
      qs.push({ q:`${unit.wpn.name}: what is its ${label}?`, opts, correct:opts.indexOf(correct), explanation:`${unit.wpn.name} has ${key} of ${correct}.`, tag:"⚔️ WEAPON RECALL" });
    });
    return shuffle(qs).slice(0,8);
  }

  const [questions] = useState(makeQs);
  return <QuizMounted raw={questions} color={f.accent} onXP={onXP} onBack={onBack} title={`${unit.name} Recall`} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEAPON MODIFIERS DATA
// ═══════════════════════════════════════════════════════════════════════════════
const MODIFIERS = [
  {
    name: "Lethal Hits",
    icon: "☠️",
    color: "#dd4444",
    oneliner: "Critical hits auto-wound — skip the wound roll entirely.",
    description: "Each time an attack scores a Critical Hit (unmodified hit roll of 6), that attack automatically wounds the target. Do not make a wound roll — proceed directly to the saving throw. The hit still counts as a hit for all other purposes.",
    category: "Hit Modifier",
    synergies: ["Sustained Hits — both trigger on critical hits, generating extra hits that also auto-wound","Twin-linked — re-rolling hits gives more chances for critical 6s"],
    antiSynergies: ["Torrent — Torrent weapons auto-hit, so there are no hit rolls and therefore no critical hits. Lethal Hits has zero effect on Torrent weapons.","Extra Attacks from re-rolls don't benefit — the new attacks follow normal hit roll rules"],
    didYouKnow: "Lethal Hits does NOT work with Torrent weapons. Torrent skips the hit roll entirely, meaning there's no roll to score a critical hit on. Both keywords are wasted together.",
  },
  {
    name: "Sustained Hits",
    icon: "⚡",
    color: "#f0a020",
    oneliner: "Critical hits generate bonus hits equal to the listed value.",
    description: "Each time an attack scores a Critical Hit (unmodified hit roll of 6), the weapon scores a number of additional hits equal to the value listed after this keyword (e.g. a value of 1 gives 1 extra hit per critical, a value of 2 gives 2 extra hits). These bonus hits are resolved as separate attacks and must roll to wound normally.",
    category: "Hit Modifier",
    synergies: ["Lethal Hits — bonus hits from Sustained Hits are separate attacks and CAN benefit from Lethal Hits if the unit has both","Re-roll hit abilities — more hit rolls = more chances for 6s = more bonus hits","High shot-count weapons — the more dice you roll, the more 6s on average"],
    antiSynergies: ["Torrent — same as Lethal Hits; no hit rolls means no critical hits, so Sustained Hits does nothing on Torrent weapons","Low shot count weapons — a single-shot weapon has a low chance of rolling a 6"],
    didYouKnow: "Sustained Hits 2 means EACH critical hit scores 2 bonus hits, not the whole unit. A unit with 10 models each with Sustained Hits 2 could theoretically generate a huge pile of extra hits.",
  },
  {
    name: "Devastating Wounds",
    icon: "💥",
    color: "#dc143c",
    oneliner: "Critical wounds bypass ALL saves — but after-save damage-negation abilities still apply.",
    description: "Each time an attack scores a Critical Wound (unmodified wound roll of 6), no saving throw of any kind can be made against that attack — including invulnerable saves. The attack inflicts a special type of irresistible damage equal to the weapon's Damage characteristic instead of normal damage. After-save damage-negation abilities CAN still be used against this damage.",
    category: "Wound Modifier",
    synergies: ["High Damage weapons — a Damage 6 weapon with Devastating Wounds dealing 6 mortal wounds is devastating","Re-roll wound abilities — more wound roll attempts mean more chances to roll that 6","Lethal Hits — auto-wounding on critical hits creates more wound rolls, increasing Devastating Wounds procs","Precision — if the weapon also has Precision, the mortal wounds can be allocated to a Character"],
    antiSynergies: ["Feel No Pain — unlike invulnerable saves, FNP still works against Devastating Wounds mortal wounds","Low Damage (D1) weapons — Devastating Wounds on a D1 weapon only deals 1 mortal wound on a 6, same as a normal unsaved wound","Multiple instances don't stack — if a weapon somehow had Devastating Wounds twice, only one instance applies"],
    didYouKnow: "Devastating Wounds bypasses armour AND invulnerable saves — but the defender STILL rolls Feel No Pain. Many players assume FNP is also bypassed. It is not. A Daemon with 4+ FNP still rolls against every mortal wound from Devastating Wounds.",
  },
  {
    name: "Torrent",
    icon: "🌊",
    color: "#4a9adc",
    oneliner: "This weapon auto-hits — no hit roll is made at all.",
    description: "Each time an attack is made with this weapon, it automatically hits the target. Do not make a hit roll — proceed directly to the wound roll. Because there is no hit roll, critical hits cannot occur and keywords that rely on critical hits have no effect.",
    category: "Hit Modifier",
    synergies: ["Devastating Wounds — critical WOUNDS (not hits) still work, so Torrent + Devastating Wounds is valid","High AP values — you still make wound and save rolls, so AP matters","Blast — Torrent and Blast can combine; Blast scales shots by target unit size"],
    antiSynergies: ["Lethal Hits — completely wasted; no hit roll means no critical hit","Sustained Hits — completely wasted; no hit roll means no critical hit","Re-roll hit roll abilities — irrelevant since there is no hit roll to re-roll"],
    didYouKnow: "Because Torrent auto-hits, it is extremely effective against units with poor saves (Orks on 6+) and in situations where hit roll penalties would normally cripple a weapon (e.g. shooting after Advancing).",
  },
  {
    name: "Feel No Pain",
    icon: "💀",
    color: "#9a5adc",
    oneliner: "After a failed save, roll a die — on the FNP value or better, ignore that point of damage.",
    description: "Each time a model with this ability would lose a wound — including wounds from irresistible damage types — roll one D6 after the saving throw is resolved (or if no save is possible). If the result equals or exceeds the value listed after this keyword (e.g. 5+), that wound is not lost. One roll is made per point of damage suffered.",
    category: "Defence Modifier",
    synergies: ["High Wound models — the more wounds you have, the more chances to use FNP across multiple damage points","Mortal wound sources — FNP works against mortal wounds too (unless the ability specifically says otherwise)","Multiple layers of saves — pairing FNP with a good invulnerable save creates a formidable defence stack"],
    antiSynergies: ["Some abilities explicitly state they bypass FNP — always check the exact wording","Low-damage weapons — FNP is less impactful if each attack only deals 1 damage"],
    didYouKnow: "FNP is rolled ONCE PER DAMAGE POINT, not once per wound. A weapon that deals 3 damage gets 3 separate FNP rolls if the save is failed. This is one of the most commonly misplayed rules in the game.",
  },
  {
    name: "Blast",
    icon: "💣",
    color: "#f0a020",
    oneliner: "Add +1 Attack for every 5 models in the target unit (rounding down).",
    description: "Each time an attack is made with this weapon, add 1 to the Attacks characteristic for every 5 models in the target unit, rounding down. For example: targeting a 10-model unit gives +2 attacks; targeting a 20-model unit gives +4. This weapon can never target a unit that is within Engagement Range of any units from the attacking model's army.",
    category: "Special Rule",
    synergies: ["Large unit targets — the bonus scales directly with enemy unit size; devastating against 20-model blobs","High base attacks — each bonus attack adds proportionally more value on a high-attack weapon","AP weapons — more attacks landing means AP value converts to more unsaved wounds"],
    antiSynergies: ["Small elite units (fewer than 5 models) — provides zero bonus since rounding down gives 0","Characters — cannot target Characters unless they are the closest visible enemy unit","Friendly units in combat nearby — cannot fire at all if target is within Engagement Range of any friendly unit"],
    didYouKnow: "The old 'minimum 3 shots / maximum shots against 11+ models' rule was from a previous version. The current Wahapedia rule is simply +1 Attack per 5 models in the target unit. Check your source — many older guides still have the incorrect version.",
  },
  {
    name: "Indirect Fire",
    icon: "🎪",
    color: "#7a9a5a",
    oneliner: "Can target units not visible to the firing model, but at -1 to hit and target gets cover.",
    description: "This weapon can target a unit that is not visible to the firing model. When doing so, subtract 1 from all hit rolls and the target unit receives the benefit of cover against those attacks. If the target IS visible to the firer, no penalty applies — fire as normal.",
    category: "Special Rule",
    synergies: ["High shot counts — the -1 to hit hurts less when you're rolling many dice","Long range weapons — the ability to shoot over terrain has more value the further you can reach","Units hiding behind dense terrain — if a unit would otherwise be completely untargetable, Indirect Fire is invaluable"],
    antiSynergies: ["Low BS weapons — -1 to hit on a BS5+ brings you to 6+, meaning only 1 in 6 shots hit","Already hitting on 3+ or better is fine, but the -1 stacks with other modifiers"],
    didYouKnow: "If you CAN see the target, you don't have to use Indirect Fire — just shoot normally. The penalty only applies when choosing to fire at a non-visible target.",
  },
  {
    name: "Melta",
    icon: "🔥",
    color: "#ff6a00",
    oneliner: "Within half range, add D6 to the weapon's damage.",
    description: "If the target is within half this weapon's printed Range characteristic when the attack is made, add D6 to this weapon's Damage characteristic for that attack. If a number follows the keyword (e.g. the value 2), add 2D6 instead. This bonus applies per attack.",
    category: "Damage Modifier",
    synergies: ["Deep Strike — arriving close to a vehicle and firing point-blank maximises Melta value","Fast units — getting within half range reliably is key; Jump Pack and Mounted units help","High base damage profiles — even without the bonus, Melta weapons hit hard"],
    antiSynergies: ["Long-range static play — Melta weapons need to be close, which conflicts with staying-back strategies","Low-toughness targets — wasted Melta bonus on T3 infantry you'd kill with AP0 anyway"],
    didYouKnow: "The Melta bonus applies within half the weapon's printed range, not half your movement range. A 24\" Melta weapon gets the bonus within 12\", regardless of where the model moved from.",
  },
  {
    name: "Twin-linked",
    icon: "🔗",
    color: "#aaaaff",
    oneliner: "Re-roll all failed wound rolls for this weapon.",
    description: "Each time an attack is made with this weapon, you can re-roll the wound roll if it failed. This applies to all failed wound rolls — those that did not result in a successful wound — making the weapon more consistent across all Strength vs Toughness matchups.",
    category: "Wound Modifier",
    synergies: ["Low Strength vs high Toughness matchups — re-rolling 5+ wound rolls makes a significant difference","Lethal Hits — more wound roll attempts increase the chance of rolling a 6 for Devastating Wounds or critical effects","High Damage weapons — ensuring wounds land reliably matters most when each wound counts"],
    antiSynergies: ["Devastating Wounds — Twin-linked re-rolls wound rolls, which CAN help fish for 6s, so this is actually a mild synergy","Already-reliable wound rolls (e.g. S10 vs T4 wounding on 2+) — re-rolling a 1 is a small benefit"],
    didYouKnow: "Twin-linked re-rolls WOUND rolls, not hit rolls. It's often confused with Guided or re-roll hit abilities. It's especially powerful when you're wounding on 5s or 6s and need reliability.",
  },
  {
    name: "Precision",
    icon: "🎯",
    color: "#00e5cc",
    oneliner: "Critical hits can be allocated to a CHARACTER hiding within a unit.",
    description: "Each time an attack with this ability scores a Critical Hit, if the target unit contains a Character, the attacking player may allocate that wound to the Character model rather than following normal wound allocation rules (closest model first).",
    category: "Special Rule",
    synergies: ["Sustained Hits — generating more critical hits means more Precision triggers and more chances to wound the Character","High Damage weapons — a Precision hit on a fragile 4-wound Character is devastating","Lethal Hits — auto-wounding on critical hits means a Precision critical hit is guaranteed to wound the Character"],
    antiSynergies: ["Single-shot low-BS weapons — low probability of rolling a 6 on one die","Units without Characters — Precision is irrelevant if there's no Character to target"],
    didYouKnow: "Precision lets you snipe Characters hiding inside larger units — a key way to remove buffs like Auras or Rites of Battle that protect nearby units. Without Precision, the Character is protected by normal wound allocation.",
  },
  {
    name: "Mortal Wounds",
    icon: "☢️",
    color: "#cc44aa",
    oneliner: "Bypasses hit, wound and all save rolls — and spills over between models.",
    description: "A type of damage that bypasses the entire attack sequence. No hit roll, wound roll, or saving throw of any kind is made — armour and invulnerable saves are both skipped. Only after-save damage-negation abilities and rules that specifically reference this damage type can reduce it. Unlike normal damage, this type CARRIES OVER to the next model in the unit when a model is destroyed by it. Exception: when this damage type is inflicted as a result of a Critical Wound, it does NOT carry over.",
    category: "Damage Type",
    synergies: ["Feel No Pain — the only common save that still works against mortal wounds","Multiple mortal wound sources — stacking abilities that deal mortals can overwhelm FNP-less units","Units without invulnerable saves — mortal wounds bypass all saves equally"],
    antiSynergies: ["Feel No Pain — significantly reduces the impact on well-protected units","Devastating Wounds mortal wounds — these specifically do NOT carry over, unlike regular mortal wounds"],
    didYouKnow: "Regular mortal wounds carry over between models — 3 mortal wounds against a 2-wound model kills it, and the leftover 1 passes to the next model. Mortal wounds from Devastating Wounds do NOT carry over — they are lost when the target model is destroyed. This is a key rules distinction.",
  },
  {
    name: "Anti",
    icon: "🏹",
    color: "#44ccff",
    oneliner: "Against a specific keyword target, scores Critical Wounds on a lower value than 6.",
    description: "This keyword is always paired with a unit type and a value — for example, targeting Infantry on a 4+, or targeting Monsters on a 5+. Each time an attack is made against a unit with the matching type, an unmodified wound roll equal to or greater than the listed value counts as a Critical Wound — even on a 4 or 5. Against other unit types, the weapon wounds at normal Strength vs Toughness values.",
    category: "Wound Modifier",
    synergies: ["Devastating Wounds — lowering the Critical Wound threshold massively increases the rate of bypassing all saves against the named target type","Precision — more Critical Wounds means more chances to allocate to a Character with the target keyword","Re-roll wound abilities — more wound rolls means more chances to hit the Anti threshold"],
    antiSynergies: ["Units without the targeted keyword — the ability has no effect; wound at normal S vs T values","Multiple Anti values don't stack — only one Critical Wound threshold applies per attack"],
    didYouKnow: "Anti-Infantry 4+ means ANY unmodified wound roll of 4, 5, or 6 counts as a Critical Wound against Infantry — not just 6s. Combined with Devastating Wounds this means 50% of all wound rolls against Infantry bypass every save. Anti-Monster 4+ on a Devastating Wounds weapon is similarly punishing against large targets.",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MODIFIER INTERACTIONS QUIZ DATA — Wahapedia verified
// ═══════════════════════════════════════════════════════════════════════════════
const MODIFIER_INTERACTIONS = [
  {
    tag:"🔧 INTERACTION", cat:"Lethal Hits + Sustained Hits",
    q:"A weapon has both Lethal Hits and Sustained Hits 1. It scores a Critical Hit. What happens?",
    opts:["The original attack auto-wounds AND generates 1 bonus hit that also auto-wounds","The original attack auto-wounds AND generates 1 bonus hit — but the bonus hit rolls to wound normally","Only one keyword applies — the controlling player chooses which","The attack auto-wounds only; Sustained Hits is ignored when Lethal Hits applies"],
    correct:1,
    explanation:"Both keywords apply on a Critical Hit. Lethal Hits makes the original attack auto-wound. Sustained Hits 1 generates 1 bonus hit. However, that bonus hit is a separate new attack — it rolls to wound normally. It does NOT also auto-wound.",
  },
  {
    tag:"🔧 INTERACTION", cat:"Torrent + Lethal Hits",
    q:"A Torrent weapon also has Lethal Hits. What does Lethal Hits do when the weapon fires?",
    opts:["Auto-wounds on every attack since Torrent already ensured the hit","Nothing — Torrent auto-hits with no hit roll, so no Critical Hit can occur","Every attack counts as a Critical Hit since it always hits","Lethal Hits applies to wound rolls instead when combined with Torrent"],
    correct:1,
    explanation:"Torrent auto-hits by skipping the hit roll entirely. Lethal Hits triggers on an unmodified hit roll of 6 — a Critical Hit. With no hit roll there can be no Critical Hit. Lethal Hits (and Sustained Hits) are both completely wasted on Torrent weapons.",
  },
  {
    tag:"🔧 INTERACTION", cat:"Devastating Wounds + Feel No Pain",
    q:"A Devastating Wounds weapon scores a Critical Wound against a model with a 4+ invulnerable save and Feel No Pain 5+. What defences apply?",
    opts:["Both saves are bypassed — no rolls at all, damage applied directly","The invulnerable save is bypassed, but FNP is still rolled for each mortal wound","Both saves are bypassed, but one FNP roll is made for the whole attack","The invulnerable save applies since no armour save was specified"],
    correct:1,
    explanation:"Devastating Wounds bypasses ALL saving throws — both armour and invulnerable. However, Feel No Pain is not a saving throw. The defender still rolls FNP 5+ against each mortal wound inflicted. FNP is the only defence that still applies against Devastating Wounds.",
  },
  {
    tag:"🔧 INTERACTION", cat:"Anti + Devastating Wounds",
    q:"A weapon with Anti-Infantry 4+ and Devastating Wounds attacks an Infantry unit. The wound roll is 4. What happens?",
    opts:["A normal wound — a 4 just meets the wound table, not a Critical Wound","Critical Wound — Anti-Infantry 4+ makes any unmodified 4, 5 or 6 a Critical Wound, triggering Devastating Wounds","The 4 meets Anti-Infantry threshold but Devastating Wounds only triggers on a natural 6","The attack auto-wounds but does not trigger Devastating Wounds"],
    correct:1,
    explanation:"Anti-Infantry 4+ means unmodified wound rolls of 4, 5, or 6 all count as Critical Wounds against Infantry. Devastating Wounds triggers on Critical Wounds. So a roll of 4 against Infantry bypasses all saves and deals mortal wounds equal to Damage. An extremely powerful combination.",
  },
  {
    tag:"🔧 INTERACTION", cat:"Feel No Pain + Damage",
    q:"A 3-damage weapon wounds and the armour save is failed. The target has Feel No Pain 5+. How many FNP rolls are made?",
    opts:["1 roll — one per wound suffered","3 rolls — one per damage point","2 rolls — one for the wound, one for excess damage","1 roll with result halved since the armour save already failed"],
    correct:1,
    explanation:"Feel No Pain is rolled once per DAMAGE POINT, not once per wound. 3 damage = 3 separate FNP rolls. Each 5+ ignores that specific damage point independently. This is one of the most commonly misplayed rules in 10th Edition.",
  },
  {
    tag:"🔧 INTERACTION", cat:"Mortal Wounds — Carry Over",
    q:"Regular mortal wounds deal 3 wounds to a model with only 2 wounds remaining. What happens to the excess 1 mortal wound?",
    opts:["Lost — mortal wounds are capped at the target model's remaining wounds","It carries over to the next model in the unit","The attacking player chooses which model receives the excess","The unit must take a Battle-shock test instead of receiving the excess"],
    correct:1,
    explanation:"Regular mortal wounds DO carry over — excess damage passes to the next model. 3 mortal wounds against a 2-wound model kills it and the remaining 1 is allocated to the next nearest model. IMPORTANT: mortal wounds from Devastating Wounds do NOT carry over — they are lost when the model is destroyed.",
  },
  {
    tag:"🔧 INTERACTION", cat:"Twin-linked + Devastating Wounds",
    q:"A weapon with Twin-linked and Devastating Wounds rolls a 4 to wound (not a Critical Wound). What does Twin-linked do?",
    opts:["Nothing — Twin-linked only activates on Critical Wounds","Re-roll is available — Twin-linked lets you re-roll any failed wound roll including non-critical ones","Re-roll only if result was 5 (one short of a 6)","Twin-linked is redundant when Devastating Wounds is on the same weapon"],
    correct:1,
    explanation:"Twin-linked lets you re-roll ANY failed wound roll. A non-6 that failed to wound is still a failed wound roll — you can re-roll it. If the re-roll produces a 6, Devastating Wounds then triggers. This makes Twin-linked a useful way to fish for Critical Wounds on Devastating Wounds weapons.",
  },
  {
    tag:"🔧 INTERACTION", cat:"Fire Overwatch hit roll",
    q:"You use Fire Overwatch (1CP). Your unit has BS3+. What roll is needed to hit?",
    opts:["3+ — normal BS applies","4+ — a -1 penalty applies during Overwatch","6 — Fire Overwatch requires an unmodified 6 to hit regardless of BS","5+ — Overwatch always uses a fixed 5+ to hit"],
    correct:2,
    explanation:"Fire Overwatch has a specific rule: each time a model makes a ranged attack during Overwatch, an unmodified hit roll of 6 is required to score a hit — irrespective of the weapon's BS or any modifiers. This is a critical restriction many players miss.",
  },
];

// DID YOU KNOW DATA — Wahapedia verified
const DID_YOU_KNOW = [
  { icon:"☠️", category:"Lethal Hits", tip:"Lethal Hits does nothing on Torrent weapons. Torrent auto-hits so there's no hit roll — and no hit roll means no critical hit to trigger Lethal Hits. Both rules are completely wasted together." },
  { icon:"💀", category:"Feel No Pain", tip:"FNP is rolled once per damage point, not per wound. A D3-damage weapon that wounds deals up to 3 separate FNP rolls. Failing to roll three times is one of the most common mistakes at the table." },
  { icon:"💥", category:"Devastating Wounds", tip:"Devastating Wounds bypasses armour saves AND invulnerable saves — but NOT Feel No Pain. The defender still rolls FNP against every mortal wound inflicted. A Daemon with a 4+ FNP is still quite resilient against Devastating Wounds weapons." },
  { icon:"🔁", category:"Re-rolls", tip:"Re-rolls are applied BEFORE modifiers. You re-roll the raw die, then any +1 or -1 applies to the new result. A re-rolled 3 with +1 to hit becomes a 4 — it does not 'un-reroll' if the modified result would have passed." },
  { icon:"🎯", category:"Precision", tip:"Precision lets you allocate Critical Hits to a Character hiding in a unit. Without it, you must allocate wounds to the closest model — so Characters can hide deep in units and be effectively untargetable." },
  { icon:"💣", category:"Blast", tip:"Blast weapons cannot be fired if the target unit is within Engagement Range of ANY friendly unit — not just yours. This catches many players out when allies are locked in combat nearby." },
  { icon:"🌊", category:"Torrent", tip:"Torrent weapons cannot benefit from hit re-rolls either — since there's no hit roll, there's nothing to re-roll. Abilities like 'Oath of Moment' that grant hit re-rolls are wasted on Torrent weapons." },
  { icon:"⚡", category:"Sustained Hits", tip:"Sustained Hits 2 means each critical hit generates 2 extra hits, not 2 extra hits for the whole unit. A 10-model unit each rolling one shot could theoretically get 20 bonus hits if everyone rolled a 6." },
  { icon:"🔥", category:"Melta", tip:"Melta range is measured against the weapon's printed range — not your movement. A 12\" Melta weapon fired at 5\" counts as within half range (6\"), so you always get the bonus from point-blank range." },
  { icon:"🔗", category:"Twin-linked", tip:"Twin-linked re-rolls wound rolls, not hit rolls. It's especially powerful when wounding on 5s or 6s — turning a 33% wound chance into roughly 55% by re-rolling failed attempts." },
  { icon:"⚠️", category:"Fight Phase", tip:"A unit that charged this turn has Fights First — even if the opponent also has a Fights First unit. When both sides have Fights First, the active player (whose turn it is) chooses which fights first." },
  { icon:"🛡️", category:"Cover", tip:"Cover does NOT help units with a 3+ save or better against AP 0 weapons. It only gives the +1 save bonus to units with a 4+ save or worse, or against weapons with any AP modifier." },
  { icon:"📐", category:"Engagement Range", tip:"Engagement Range is 1\" horizontal AND 5\" vertical. Two models on different floors of a ruin separated by 6\" vertically are NOT in Engagement Range — even if only 0.5\" apart horizontally." },
  { icon:"🏴", category:"Objectives", tip:"A Battle-shocked unit's OC drops to 0. Even if 10 Battle-shocked models are standing on an objective, they contribute nothing to holding it — a single conscious enemy model nearby will take it." },
  { icon:"🎪", category:"Indirect Fire", tip:"Indirect Fire's -1 to hit only applies when targeting a unit you CANNOT see. If you have line of sight, fire normally with no penalty — the ability just gives you the option to shoot blind." },
  { icon:"📋", category:"Deep Strike", tip:"Deep Strike requires more than 9\" horizontally from ALL enemy models — not just the nearest one. That includes enemy units behind you. Always measure to every visible enemy model before placing." },
  { icon:"💠", category:"Stratagems", tip:"The same Stratagem can only be used once per phase — but you can use multiple different Stratagems in the same phase. Read: two different 1CP stratagems in the Shooting phase is fine; the same one twice is not." },
  { icon:"🔄", category:"Sequencing", tip:"When two of YOUR rules trigger simultaneously during your opponent's turn, YOUR OPPONENT decides the order — because it's their turn, making them the active player. This catches a lot of people off guard." },
  { icon:"☢️", category:"Mortal Wounds", tip:"Regular mortal wounds carry over — 3 mortal wounds against a 2-wound model kills it and the leftover 1 passes to the next model. Mortal wounds from Devastating Wounds do NOT carry over — they are lost when the target model dies." },
  { icon:"🏹", category:"Anti", tip:"Anti-Infantry 4+ means ANY unmodified wound roll of 4, 5, or 6 counts as a Critical Wound against Infantry. Combined with Devastating Wounds, 50% of wound rolls bypass every save. This is one of the most powerful keyword combinations in the game." },
  { icon:"⚔️", category:"Battle-shock", tip:"To PASS a Battle-shock test, roll 2D6 and get equal to or ABOVE the unit's Leadership value. Ld 7+ means you need a 7 or higher to pass. Many players wrongly think you roll UNDER Leadership like older editions — the opposite is true in 10th." },
  { icon:"🔫", category:"Fire Overwatch", tip:"Fire Overwatch hits on 6s ONLY — regardless of the weapon's BS or any modifiers. A BS2+ model using Fire Overwatch still needs an unmodified 6 to hit. This is a hard rule that overrides normal BS entirely." },
  { icon:"💣", category:"Blast", tip:"The current Blast rule adds +1 Attack per 5 models in the target unit (rounding down). Many players remember an older 'minimum 3 shots / max shots at 11+' version — that rule no longer applies. Always check Wahapedia for the current wording." },
];

// Modifier matching quiz — description shown, user picks the keyword name
// 3 plausible distractors always from the same category or adjacent categories
function buildModifierQuiz() {
  return shuffle(MODIFIERS).map(mod => {
    const others = MODIFIERS.filter(m => m.name !== mod.name);
    // Prefer distractors from same/adjacent categories for plausibility
    const sameCat = others.filter(m => m.category === mod.category);
    const diffCat = others.filter(m => m.category !== mod.category);
    const pool = [...shuffle(sameCat), ...shuffle(diffCat)];
    const distractors = pool.slice(0, 3).map(m => m.name);
    const opts = shuffle([mod.name, ...distractors]);
    return {
      tag: "🔧 MODIFIER MATCH",
      q: mod.description,
      hint: mod.oneliner,
      opts,
      correct: opts.indexOf(mod.name),
      explanation: `This is ${mod.name}. ${mod.didYouKnow}`,
      modName: mod.name,
      modColor: mod.color,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODIFIER MATCHING GAME COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function ModifierMatch({ onXP, onBack }) {
  const [view, setView] = useState(null); // null | "match" | "browse" | modifier-name

  if (view === "match") {
    return <QuizMounted raw={buildModifierQuiz()} color="#f0a020" onXP={onXP} onBack={() => setView(null)} title="Modifier Match" />;
  }

  if (typeof view === "string" && view !== "match" && view !== "browse") {
    const mod = MODIFIERS.find(m => m.name === view);
    if (!mod) return null;
    return (
      <div>
        <BackBtn onClick={() => setView("browse")} />
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <span style={{fontSize:32}}>{mod.icon}</span>
          <div>
            <div style={{fontSize:9,color:mod.color,letterSpacing:3,fontFamily:"'Cinzel',serif",marginBottom:2}}>{mod.category.toUpperCase()}</div>
            <div style={{fontSize:22,fontWeight:700,color:"#e0d5c5",fontFamily:"'Cinzel Decorative',serif",lineHeight:1.1}}>{mod.name}</div>
          </div>
        </div>
        <div style={{background:`${mod.color}11`,border:`1px solid ${mod.color}44`,borderRadius:12,padding:16,marginBottom:12}}>
          <div style={{fontSize:11,color:mod.color,fontFamily:"'Cinzel',serif",letterSpacing:2,marginBottom:8}}>IN PLAIN ENGLISH</div>
          <div style={{fontSize:15,color:"#e0d5c5",fontFamily:"'Crimson Pro',serif",lineHeight:1.6,fontWeight:600}}>{mod.oneliner}</div>
        </div>
        <div style={{background:"#0d0d1a",border:"1px solid #252535",borderRadius:12,padding:16,marginBottom:12}}>
          <div style={{fontSize:11,color:"#888",fontFamily:"'Cinzel',serif",letterSpacing:2,marginBottom:8}}>FULL RULES TEXT</div>
          <div style={{fontSize:13,color:"#b0a890",fontFamily:"'Crimson Pro',serif",lineHeight:1.75}}>{mod.description}</div>
        </div>
        <div style={{background:"#0a0d0a",border:"1px solid #1a3a1a",borderRadius:12,padding:16,marginBottom:12}}>
          <div style={{fontSize:11,color:"#5aaa5a",fontFamily:"'Cinzel',serif",letterSpacing:2,marginBottom:10}}>✓ SYNERGISES WITH</div>
          {mod.synergies.map((s,i) => (
            <div key={i} style={{display:"flex",gap:8,marginBottom:7}}>
              <span style={{color:"#5aaa5a",flexShrink:0,marginTop:2}}>▸</span>
              <span style={{fontSize:12,color:"#aaa",fontFamily:"'Crimson Pro',serif",lineHeight:1.6}}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{background:"#0d0a0a",border:"1px solid #3a1a1a",borderRadius:12,padding:16,marginBottom:12}}>
          <div style={{fontSize:11,color:"#dd7d7d",fontFamily:"'Cinzel',serif",letterSpacing:2,marginBottom:10}}>✗ DOES NOT SYNERGISE WITH</div>
          {mod.antiSynergies.map((s,i) => (
            <div key={i} style={{display:"flex",gap:8,marginBottom:7}}>
              <span style={{color:"#dd7d7d",flexShrink:0,marginTop:2}}>▸</span>
              <span style={{fontSize:12,color:"#aaa",fontFamily:"'Crimson Pro',serif",lineHeight:1.6}}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{background:"#0e0c04",border:"1px solid #3a3000",borderRadius:12,padding:16}}>
          <div style={{fontSize:11,color:"#f0a020",fontFamily:"'Cinzel',serif",letterSpacing:2,marginBottom:8}}>💡 DID YOU KNOW?</div>
          <div style={{fontSize:13,color:"#c0b060",fontFamily:"'Crimson Pro',serif",lineHeight:1.7}}>{mod.didYouKnow}</div>
        </div>
      </div>
    );
  }

  if (view === "browse") {
    return (
      <div>
        <BackBtn onClick={() => setView(null)} />
        <SectionHead title="Modifier Reference" sub="Browse All Keywords" accent="#f0a020" />
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {MODIFIERS.map(mod => (
            <button key={mod.name} onClick={() => setView(mod.name)} style={{background:"#0d0d1a",border:`1px solid ${mod.color}44`,borderRadius:10,padding:"13px 15px",display:"flex",alignItems:"center",gap:12,cursor:"pointer",textAlign:"left",width:"100%"}}>
              <span style={{fontSize:22,flexShrink:0}}>{mod.icon}</span>
              <div style={{flex:1}}>
                <div style={{color:mod.color,fontFamily:"'Cinzel',serif",fontSize:13,marginBottom:2}}>{mod.name}</div>
                <div style={{color:"#666",fontSize:11,fontFamily:"'Crimson Pro',serif",lineHeight:1.4}}>{mod.oneliner}</div>
              </div>
              <span style={{color:"#333",fontSize:16,flexShrink:0}}>›</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <BackBtn onClick={onBack} />
      <SectionHead title="Weapon Modifiers" sub="Keywords & Special Rules" accent="#f0a020" />
      <p style={{color:"#666",fontSize:13,marginBottom:18,fontFamily:"'Crimson Pro',serif",lineHeight:1.7}}>
        Read the description — name the keyword. Master Lethal Hits, Torrent, FNP, Blast and more.
      </p>
      <MenuRow icon="🔧" label="Modifier Match Quiz" sublabel="Read the rule, pick the keyword name — includes synergy notes" accent="#f0a020" borderCol="#3a2a00" onClick={() => setView("match")} />
      <MenuRow icon="📖" label="Browse All Modifiers" sublabel={`${MODIFIERS.length} keywords with synergies, anti-synergies & rulings`} accent="#c088e0" borderCol="#2a1a4a" onClick={() => setView("browse")} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DID YOU KNOW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
function DidYouKnow({ onBack }) {
  const [filter, setFilter] = useState("All");
  const categories = ["All", ...Array.from(new Set(DID_YOU_KNOW.map(d => d.category)))];
  const visible = filter === "All" ? DID_YOU_KNOW : DID_YOU_KNOW.filter(d => d.category === filter);

  return (
    <div>
      <BackBtn onClick={onBack} />
      <SectionHead title="Did You Know?" sub="Rules Tips & Surprises" accent="#f0a020" />
      <p style={{color:"#666",fontSize:13,marginBottom:14,fontFamily:"'Crimson Pro',serif",lineHeight:1.7}}>
        Bite-sized facts that surprise even experienced players. Swipe through and spot what you've been playing wrong.
      </p>
      {/* Category filter pills */}
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:18}}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)} style={{background:filter===cat?"#1a0e00":"#0d0d1a",border:`1px solid ${filter===cat?"#f0a020":"#252535"}`,borderRadius:20,padding:"4px 12px",color:filter===cat?"#f0a020":"#666",fontSize:10,letterSpacing:1,cursor:"pointer",fontFamily:"'Cinzel',serif"}}>
            {cat}
          </button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {visible.map((tip, i) => (
          <div key={i} style={{background:"#0e0c04",border:"1px solid #2a2200",borderRadius:12,padding:"15px 16px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,#f0a02000,#f0a02088,#f0a02000)"}} />
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:22,flexShrink:0,marginTop:2}}>{tip.icon}</span>
              <div>
                <div style={{fontSize:9,color:"#f0a020",letterSpacing:2,fontFamily:"'Cinzel',serif",marginBottom:5}}>{tip.category.toUpperCase()}</div>
                <div style={{fontSize:13,color:"#c0b890",fontFamily:"'Crimson Pro',serif",lineHeight:1.75}}>{tip.tip}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATH 3: COMBAT TRAINER
// ═══════════════════════════════════════════════════════════════════════════════
function CombatPath({ onXP, onBack }) {
  const [mode, setMode] = useState(null);

  if (mode==="sandbox")   return <DiceSandbox onBack={()=>setMode(null)} />;
  if (mode==="modifiers") return <ModifierMatch onXP={onXP} onBack={()=>setMode(null)} />;
  if (mode==="dyk")       return <DidYouKnow onBack={()=>setMode(null)} />;
  if (mode==="mistakes")     return <QuizMounted raw={INTERACTION_QS} color="#f0a020" onXP={onXP} onBack={()=>setMode(null)} title="Combat Edge Cases" mistakeFocus />;
  if (mode==="interactions") return <QuizMounted raw={MODIFIER_INTERACTIONS} color="#f0a020" onXP={onXP} onBack={()=>setMode(null)} title="Modifier Interactions" mistakeFocus />;

  if (mode) {
    const map = { wound:WOUND_QS, save:SAVE_QS, hit:HIT_QS, all:[...WOUND_QS,...SAVE_QS,...HIT_QS,...INTERACTION_QS,...MODIFIER_INTERACTIONS] };
    const label = { wound:"Wound Rolls", save:"Save & AP", hit:"Hit Probability", all:"Full Combat Quiz" };
    return <QuizMounted raw={map[mode]||[]} color="#ffd700" onXP={onXP} onBack={()=>setMode(null)} title={label[mode]} />;
  }

  return (
    <div>
      <BackBtn onClick={onBack} />
      <SectionHead title="Combat Trainer" sub="Path III — Dice & Keywords" accent="#ffd700" />
      <p style={{color:"#666",fontSize:13,marginBottom:18,fontFamily:"'Crimson Pro',serif",lineHeight:1.7}}>
        Internalise the probability tables, weapon keywords and edge cases that separate good players from great ones.
      </p>

      <div style={{fontSize:10,color:"#ffd700",letterSpacing:2,fontFamily:"'Cinzel',serif",marginBottom:10}}>PROBABILITY DRILLS</div>
      <MenuRow icon="🗡️" label="Wound Roll Drills"  sublabel="Strength vs Toughness — all combinations" accent="#ffd700" borderCol="#3a3a1a" onClick={()=>setMode("wound")} />
      <MenuRow icon="🛡️" label="Save & AP Drills"   sublabel="AP modifier vs armour save combinations"  accent="#7a9adc" borderCol="#1a2a4a" onClick={()=>setMode("save")} />
      <MenuRow icon="🎯" label="Hit Probability"    sublabel="BS value & shot count — average hits"     accent="#7dda7d" borderCol="#1a3a1a" onClick={()=>setMode("hit")} />
      <MenuRow icon="🎲" label="Full Combat Quiz"   sublabel="All question types mixed together"        accent="#ffd700" borderCol="#3a2a0a" onClick={()=>setMode("all")} />

      <div style={{fontSize:10,color:"#f0a020",letterSpacing:2,fontFamily:"'Cinzel',serif",marginBottom:10,marginTop:6}}>WEAPON KEYWORDS</div>
      <MenuRow icon="🔧" label="Modifier Match"     sublabel="Read the rule description — name the keyword. Lethal Hits, Torrent, FNP & more" accent="#f0a020" borderCol="#3a2a00" onClick={()=>setMode("modifiers")} />

      <div style={{fontSize:10,color:"#f0a020",letterSpacing:2,fontFamily:"'Cinzel',serif",marginBottom:10,marginTop:6}}>EDGE CASES & TIPS</div>
      <MenuRow icon="⚠️" label="Combat Edge Cases"   sublabel="FNP, damage caps, half-strength, sequencing +30XP" accent="#f0a020" borderCol="#3a2a00" onClick={()=>setMode("mistakes")} />
      <MenuRow icon="🔀" label="Modifier Interactions" sublabel={`${MODIFIER_INTERACTIONS.length} questions — how keywords combine and conflict +30XP`} accent="#f0a020" borderCol="#3a2a00" onClick={()=>setMode("interactions")} />
      <MenuRow icon="💡" label="Did You Know?"      sublabel={`${DID_YOU_KNOW.length} tips — synergies, anti-synergies & surprises`} accent="#f0c020" borderCol="#3a3000" onClick={()=>setMode("dyk")} />

      <div style={{fontSize:10,color:"#5aaa5a",letterSpacing:2,fontFamily:"'Cinzel',serif",marginBottom:10,marginTop:6}}>REFERENCE</div>
      <MenuRow icon="⚙️" label="Dice Calculator"   sublabel="Live sliders — see exact averages for any stats" accent="#5aaa5a" borderCol="#1a3a1a" onClick={()=>setMode("sandbox")} />
    </div>
  );
}

function DiceSandbox({ onBack }) {
  const [s,setS]=useState(4); const [t,setT]=useState(4);
  const [ap,setAp]=useState(0); const [sv,setSv]=useState(3);
  const [inv,setInv]=useState(0); const [bs,setBs]=useState(3);
  const [shots,setShots]=useState(2);

  const wRoll=getWoundRoll(s,t);
  const rawSv=sv+ap; const effSv=inv>0&&inv<rawSv?inv:rawSv;
  const hitPct=(7-bs)/6;
  const wPct=wRoll==="2+"?5/6:wRoll==="3+"?4/6:wRoll==="4+"?3/6:wRoll==="5+"?2/6:1/6;
  const sPct=effSv>=7?0:(7-effSv)/6;
  const avgH=(shots*hitPct).toFixed(2);
  const avgW=(shots*hitPct*wPct).toFixed(2);
  const avgU=(shots*hitPct*wPct*(1-sPct)).toFixed(2);
  const efficiency=shots>0?Math.round((shots*hitPct*wPct*(1-sPct))/shots*100):0;

  const Sl=({label,val,min,max,set,unit=""})=>(
    <div style={{marginBottom:11}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
        <span style={{fontSize:10,color:"#888",fontFamily:"'Cinzel',serif"}}>{label}</span>
        <span style={{fontSize:14,color:"#ffd700",fontFamily:"'Cinzel',serif",fontWeight:700}}>{val}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={val} onChange={e=>set(Number(e.target.value))} style={{width:"100%",accentColor:"#ffd700"}} />
    </div>
  );

  return (
    <div>
      <BackBtn onClick={onBack} />
      <SectionHead title="Dice Calculator" sub="Combat Sandbox" accent="#ffd700" />
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        <div style={{background:"#0d0d1a",border:"1px solid #2a2a1a",borderRadius:10,padding:13}}>
          <div style={{fontSize:9,color:"#ffd700",letterSpacing:2,fontFamily:"'Cinzel',serif",marginBottom:11}}>ATTACKER</div>
          <Sl label="Shots" val={shots} min={1} max={12} set={setShots} />
          <Sl label="Ballistic Skill" val={bs} min={2} max={6} set={setBs} unit="+" />
          <Sl label="Strength" val={s} min={1} max={16} set={setS} />
          <Sl label="AP" val={ap} min={0} max={6} set={setAp} />
        </div>
        <div style={{background:"#0d0d1a",border:"1px solid #1a1a2a",borderRadius:10,padding:13}}>
          <div style={{fontSize:9,color:"#7a9adc",letterSpacing:2,fontFamily:"'Cinzel',serif",marginBottom:11}}>DEFENDER</div>
          <Sl label="Toughness" val={t} min={1} max={14} set={setT} />
          <Sl label="Armour Save" val={sv} min={2} max={7} set={setSv} unit="+" />
          <Sl label="Invuln Save" val={inv} min={0} max={6} set={setInv} unit={inv>0?"+":""} />
          <div style={{fontSize:10,color:inv>0?"#c088e0":"#444",textAlign:"right",marginTop:-6,fontFamily:"'Cinzel',serif"}}>{inv>0?`Invuln: ${inv}+`:"No invuln save"}</div>
        </div>
      </div>
      <div style={{background:"#080d08",border:"1px solid #1a3a1a",borderRadius:12,padding:15}}>
        <div style={{fontSize:9,color:"#5aaa5a",letterSpacing:2,fontFamily:"'Cinzel',serif",marginBottom:12}}>COMBAT RESULT</div>
        {[
          ["Wound Roll needed",wRoll,"#ffd700"],
          [`Effective Save (AP${ap} vs ${sv}+)`,effSv>=7?"No save":`${effSv}+${inv>0&&inv<rawSv?" (invuln)":""}`,"#7a9adc"],
          [`Avg Hits (${shots}×BS${bs}+)`,avgH,"#e0d5c5"],
          ["Avg Wounds",avgW,"#f0b060"],
          ["Avg Unsaved Wounds",avgU,"#dd7d7d"],
          ["Shot Efficiency",`${efficiency}%`,"#c088e0"],
        ].map(([lbl,val,col])=>(
          <div key={lbl} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #1a2a1a"}}>
            <span style={{fontSize:12,color:"#888",fontFamily:"'Crimson Pro',serif"}}>{lbl}</span>
            <span style={{fontSize:15,fontWeight:700,color:col,fontFamily:"'Cinzel',serif"}}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP SHELL
// ═══════════════════════════════════════════════════════════════════════════════
function XPBar({ xp, level }) {
  const max=level*100; const pct=Math.min((xp/max)*100,100);
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{color:"#ffd700",fontFamily:"'Cinzel',serif",fontSize:10,minWidth:62,letterSpacing:1}}>RANK {level}</span>
      <div style={{flex:1,height:5,background:"#1a1a2e",borderRadius:3,border:"1px solid #252535",overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:"linear-gradient(90deg,#6a0020,#dc143c)",borderRadius:3,transition:"width 0.5s ease"}} />
      </div>
      <span style={{color:"#555",fontSize:9,minWidth:52,textAlign:"right"}}>{xp}/{max}XP</span>
    </div>
  );
}

const PATHS = [
  { id:"core",      icon:"📜", label:"Core Rules",        sub:"Turn structure, phases & universal mechanics",       color:"#5a8adc", border:"#1a2a5a" },
  { id:"faction",   icon:"⚔️", label:"Factions",          sub:"Detachments, unit datasheets & stat recall",         color:"#ffd700", border:"#3a2a0a" },
  { id:"combat",    icon:"🎲", label:"Combat Trainer",    sub:"Dice rolls, AP, wound tables & probability drills",  color:"#5aaa5a", border:"#1a4a1a" },
  { id:"modifiers", icon:"🔧", label:"Weapon Keywords",   sub:"Match modifier descriptions to their keyword names", color:"#f0a020", border:"#3a2a00" },
  { id:"dyk",       icon:"💡", label:"Did You Know?",     sub:"Synergies, anti-synergies & rules surprises",        color:"#f0c020", border:"#3a3000" },
];

export default function App() {
  const [path,setPath]=useState(null);
  const [xp,setXp]=useState(0);
  const [level,setLevel]=useState(1);
  const [toast,setToast]=useState(null);

  function addXP(amt) {
    setXp(prev=>{
      const next=prev+amt; const needed=level*100;
      if(next>=needed){setLevel(l=>l+1);flash("⚔️ RANK UP!");return next-needed;}
      return next;
    });
    flash(`+${amt} XP`);
  }

  function flash(msg){setToast(msg);setTimeout(()=>setToast(null),1500);}

  return (
    <div style={{minHeight:"100vh",background:"#080810",color:"#c0b5a0",fontFamily:"'Crimson Pro',serif",maxWidth:680,margin:"0 auto",paddingBottom:30}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:#080810;}::-webkit-scrollbar-thumb{background:#2a1a1a;border-radius:2px;}
        button{font-family:inherit;transition:filter 0.15s;}button:active{filter:brightness(0.85);}
        input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;background:#1a1a2a;outline:none;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;cursor:pointer;background:#ffd700;}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:"#0d0808",border:"1px solid #dc143c44",borderRadius:8,padding:"6px 18px",color:"#dc143c",fontSize:11,fontFamily:"'Cinzel',serif",letterSpacing:2,zIndex:999,pointerEvents:"none",boxShadow:"0 2px 16px #dc143c22",whiteSpace:"nowrap"}}>
          {toast}
        </div>
      )}

      {/* Sticky header */}
      <div style={{background:"linear-gradient(180deg,#0d0808 0%,#080810 100%)",borderBottom:"1px solid #1a1a28",padding:"15px 16px 12px",position:"sticky",top:0,zIndex:10,backdropFilter:"blur(10px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          {path && <button onClick={()=>setPath(null)} style={{background:"none",border:"none",color:"#555",fontSize:22,cursor:"pointer",padding:"0 6px 0 0",lineHeight:1}}>‹</button>}
          <div>
            <div style={{fontSize:16,fontWeight:900,fontFamily:"'Cinzel Decorative',serif",color:"#e0d5c5",letterSpacing:1,lineHeight:1.1}}>CODEX TRAINER</div>
            <div style={{fontSize:8,color:"#dc143c",letterSpacing:4,fontFamily:"'Cinzel',serif"}}>WARHAMMER 40,000</div>
          </div>
          <span style={{marginLeft:"auto",fontSize:20,opacity:0.5}}>⚔️</span>
        </div>
        <XPBar xp={xp} level={level} />
      </div>

      {/* Content */}
      <div style={{padding:"16px 15px"}}>
        {!path && (
          <div>
            <div style={{textAlign:"center",padding:"12px 0 22px"}}>
              <div style={{fontSize:10,color:"#3a3a4a",letterSpacing:3,fontFamily:"'Cinzel',serif",marginBottom:5}}>SELECT TRAINING PATH</div>
              <div style={{fontSize:12,color:"#2a2a3a",fontFamily:"'Crimson Pro',serif",fontStyle:"italic"}}>In the grim darkness of the far future, there is only drill.</div>
            </div>
            {PATHS.map(p=>(
              <button key={p.id} onClick={()=>setPath(p.id)} style={{background:"#0d0d1a",border:`1px solid ${p.border}`,borderRadius:14,padding:"20px 18px",display:"flex",alignItems:"center",gap:15,cursor:"pointer",textAlign:"left",position:"relative",overflow:"hidden",width:"100%",marginBottom:12}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${p.color}00,${p.color}99,${p.color}00)`}} />
                <span style={{fontSize:28,flexShrink:0}}>{p.icon}</span>
                <div style={{flex:1}}>
                  <div style={{color:p.color,fontFamily:"'Cinzel',serif",fontSize:15,fontWeight:700,letterSpacing:1,marginBottom:3}}>{p.label}</div>
                  <div style={{color:"#666",fontSize:12,fontFamily:"'Crimson Pro',serif"}}>{p.sub}</div>
                </div>
                <span style={{color:`${p.color}44`,fontSize:22,flexShrink:0}}>›</span>
              </button>
            ))}
            <div style={{marginTop:16,background:"#0a0a0a",border:"1px solid #1a1a1a",borderRadius:10,padding:"12px 14px"}}>
              <div style={{fontSize:9,color:"#f0a020",letterSpacing:2,fontFamily:"'Cinzel',serif",marginBottom:6}}>⚠️ COMMON MISTAKES INCLUDED</div>
              <div style={{fontSize:12,color:"#666",fontFamily:"'Crimson Pro',serif",lineHeight:1.6}}>
                Reroll timing · FNP per damage point · Lethal Hits + Torrent · Battle-shock restrictions · Fight phase priority — sourced from real table disputes and baked into quizzes, modifier cards and Did You Know tips across all paths.
              </div>
            </div>
          </div>
        )}
        {path==="core"      && <CorePath      onXP={addXP} onBack={()=>setPath(null)} />}
        {path==="faction"   && <FactionPath   onXP={addXP} onBack={()=>setPath(null)} />}
        {path==="combat"    && <CombatPath    onXP={addXP} onBack={()=>setPath(null)} />}
        {path==="modifiers" && <ModifierMatch onXP={addXP} onBack={()=>setPath(null)} />}
        {path==="dyk"       && <DidYouKnow               onBack={()=>setPath(null)} />}
      </div>
    </div>
  );
}
