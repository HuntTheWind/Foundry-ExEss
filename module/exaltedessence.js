// Import Modules
import { EXALTEDESSENCE } from "./config.js";

import { ExaltedessenceActor } from "./actor/actor.js";
import { ExaltedessenceActorSheet } from "./actor/actor-sheet.js";
import { ExaltedessenceItem } from "./item/item.js";
import { ExaltedessenceItemSheet } from "./item/item-sheet.js";

import { openRollDialogue } from "./apps/dice-roller.js";
import TraitSelector from "./apps/trait-selector.js";

Hooks.once('init', async function() {

  game.exaltedessence = {
    applications: {
      TraitSelector,
    },
    entities: {
      ExaltedessenceActor,
      ExaltedessenceItem,
    },
    config: EXALTEDESSENCE,
    rollItemMacro: rollItemMacro
  };

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d10cs>=7",
  };

  // Define custom Entity classes
  CONFIG.EXALTEDESSENCE = EXALTEDESSENCE;
  CONFIG.Actor.documentClass = ExaltedessenceActor;
  CONFIG.Item.documentClass = ExaltedessenceItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("exaltedessence", ExaltedessenceActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("exaltedessence", ExaltedessenceItemSheet, { makeDefault: true });

  // Pre-load templates
  loadTemplates([
    "systems/exaltedessence/templates/dialogues/ability-base.html",
    "systems/exaltedessence/templates/actor/active-effects.html",
    "systems/exaltedessence/templates/actor/equipment-list.html",
    "systems/exaltedessence/templates/actor/charm-list.html",
    "systems/exaltedessence/templates/actor/intimacies-list.html",
  ]);

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function() {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase();
  }); 

  Handlebars.registerHelper('numLoop', function (num, options) {
    let ret = ''

    for (let i = 0, j = num; i < j; i++) {
      ret = ret + options.fn(i)
    }

    return ret
  })
});

Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

$(document).ready(() => {
  const diceIconSelector = '#chat-controls .chat-control-icon .fa-dice-d20';

  $(document).on('click', diceIconSelector, ev => {
    ev.preventDefault();
    openRollDialogue();
  });
});

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createExaltedessenceMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createExaltedessenceMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.exaltedessence.rollItemMacro("${item.name}");`;
  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "exaltedessence.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}