// import {
//   DiceRollerDialogue
// } from "./dialogue-diceRoller.js";
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ExaltedessenceActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["exaltedessence", "sheet", "actor"],
      template: "systems/exaltedessence/templates/actor/actor-sheet.html",
      width: 800,
      height: 900,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "stats" }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];
    for (let attr of Object.values(data.data.data.attributes)) {
      attr.isCheckbox = attr.dtype === "Boolean";
    }

    // Prepare items.
    if (this.actor.data.type == 'character') {
      this._prepareCharacterItems(data);
    }

    return data;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {
    const actorData = sheetData.actor;

    // Initialize containers.
    const gear = [];
    const advantages = [];
    const merits = [];
    const intimacies = [];

    const charms = {
      athletics: { name: 'ExEss.Athletics', visible: false, list: [] },
      awareness: { name: 'ExEss.Awareness', visible: false, list: [] },
      close: { name: 'ExEss.CloseCombat', visible: false, list: [] },
      craft: { name: 'ExEss.Craft', visible: false, list: [] },
      embassy: { name: 'ExEss.Embassy', visible: false, list: [] },
      integrity: { name: 'ExEss.Integrity', visible: false, list: [] },
      navigate: { name: 'ExEss.Navigate', visible: false, list: [] },
      performance: { name: 'ExEss.Performance', visible: false, list: [] },
      physique: { name: 'ExEss.Physique', visible: false, list: [] },
      presence: { name: 'ExEss.Presence', visible: false, list: [] },
      ranged: { name: 'ExEss.RangedCombat', visible: false, list: [] },
      sagacity: { name: 'ExEss.Sagacity', visible: false, list: [] },
      stealth: { name: 'ExEss.Stealth', visible: false, list: [] },
      war: { name: 'ExEss.War', visible: false, list: [] },
      martial: { name: 'ExEss.MartialArts', visible: false, list: [] },
      evocation: { name: 'ExEss.Evocations', visible: false, list: [] },
    }

    const spells = {
      emerald: { name: 'ExEss.Emerald', visible: false, list: [] },
      sapphire: { name: 'ExEss.Sapphire', visible: false, list: [] },
      adamant: { name: 'ExEss.Adamant', visible: false, list: [] },
    }

    // Iterate through items, allocating to containers
    for (let i of sheetData.items) {
      let item = i.data;

      i.img = i.img || DEFAULT_TOKEN;
      // Append to gear.
      if (i.type === 'item') {
        gear.push(i);
      }
      // Append to advantages.
      else if (i.type === 'advantage') {
        advantages.push(i);
      }
      // Append to merits.
      else if (i.type === 'merit') {
        merits.push(i);
      }
      else if (i.type === 'intimacy') {
        intimacies.push(i);
      }
      // Append to charms.
      else if (i.type === 'charm') {
        if (i.data.ability !== undefined) {
          charms[i.data.ability].list.push(i);
          charms[i.data.ability].visible = true;
        }
      }
      else if (i.type === 'spell') {
        if (i.data.circle !== undefined) {
          spells[i.data.circle].list.push(i);
          spells[i.data.circle].visible = true;
        }
      }
    }

    // Assign and return
    actorData.gear = gear;
    actorData.merits = merits;
    actorData.intimacies = intimacies;
    actorData.advantages = advantages;
    actorData.charms = charms;
    actorData.spells = spells;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    this._setupDotCounters(html)
    this._setupSquareCounters(html)

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    html.find('.resource-value > .resource-value-step').click(this._onDotCounterChange.bind(this))
    html.find('.resource-value > .resource-value-empty').click(this._onDotCounterEmpty.bind(this))
    html.find('.resource-counter > .resource-counter-step').click(this._onSquareCounterChange.bind(this))

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });

    html.find('#rollDice').mousedown(ev => {
      this._openRollDialogue();
    });

    html.find('#rollAbility').mousedown(ev => {
      this._openAbilityRollDialogue();
    });

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  async _openRollDialogue() {
    let confirmed = false;
    // Enter the Die type 
    let dieNum = 10;
    // What number is starting number needed for a single success
    let singleSuccess = 7;
    // What number is starting number needed for a double success, set to 0 to disable
    const template = "systems/exaltedessence/templates/dialogues/dice-roll.html"
    const html = await renderTemplate(template, {});
    new Dialog({
      title: `Die ${dieNum} Roller`,
      content: html,
      buttons: {
        roll: { label: "Roll it!", callback: () => confirmed = true },
        cancel: { label: "Cancel", callback: () => confirmed = false }
      },
      close: html => {
        if (confirmed) {
          let doubleSuccess = this._calculateDoubleDice(html);
          let dice = parseInt(html.find('#num').val());
          let bonusSuccesses = parseInt(html.find('#bonus-success').val());

          let roll = new Roll(`${dice}d${dieNum}cs>=${singleSuccess}`).roll();
          let dice_roll = roll.dice[0].results;
          let bonus = "";
          let get_dice = "";
          for (let dice of dice_roll) {
            // comment out if no double successes
            if (dice.result >= doubleSuccess) { bonus++; }
            if (dice.result >= singleSuccess) { get_dice += `<li class="roll die d${dieNum} success">${dice.result}</li>`; }
            else { get_dice += `<li class="roll die d${dieNum}">${dice.result}</li>`; }
          }
          // if no double success uncomment below and remove the entry below that.
          //let total = roll.total;
          let total = roll.total;
          if (bonus) total += bonus;
          if (bonusSuccesses) total += bonusSuccesses;
          let the_content = `<div class="chat-card item-card"><div class="card-content">Dice Roll</div><div class="card-buttons"><div class="flexrow 1"><div>Dice Roller - Number of Successes<div class="dice-roll"><div class="dice-result"><div class="dice-formula">${roll.formula}</div><div class="dice-tooltip"><div class="dice"><ol class="dice-rolls">${get_dice}</ol></div></div><h4 class="dice-total">${total} Succeses</h4></div></div></div></div></div></div>`;
          ChatMessage.create({ user: game.user._id, speaker: ChatMessage.getSpeaker({ token: this.actor }), content: the_content, type: CONST.CHAT_MESSAGE_TYPES.OOC });
        }
      }
    }).render(true);
  }

  async _openAbilityRollDialogue() {
    let confirmed = false;
    // Enter the Die type 
    let dieNum = 10;
    // What number is starting number needed for a single success
    let singleSuccess = 7;
    // What number is starting number needed for a double success, set to 0 to disable
    const template = "systems/exaltedessence/templates/dialogues/ability-roll.html"
    const html = await renderTemplate(template, {});
    new Dialog({
      title: `Die Roller`,
      content: html,
      buttons: {
        roll: { label: "Roll it!", callback: () => confirmed = true },
        cancel: { label: "Cancel", callback: () => confirmed = false }
      },
      close: html => {
        if (confirmed) {
          const data = this.actor.data.data;
          let attribute = html.find('#attribute').val();
          let ability = html.find('#ability').val();
          let attributeExcellency = html.find('#attribute-excellency').is(':checked');
          let abilityExcellency = html.find('#ability-excellency').is(':checked');

          let stunt = html.find('#stunt').is(':checked');
          let woundPenalty = html.find('#wound-penalty').is(':checked');

          let miscBonus = parseInt(html.find('#misc-bonus').val());
          let miscPenalty = parseInt(html.find('#misc-penalty').val());

          let bonusSuccesses = parseInt(html.find('#bonus-success').val());

          let attributeDice = data.attributes[attribute].value;
          let abilityDice = data.abilities[ability].value;

          if (attributeExcellency) {
            attributeDice = attributeDice * 2;
          }
          if (abilityExcellency) {
            abilityDice = abilityDice * 2;
          }

          let doubleSuccess = this._calculateDoubleDice(html);

          if (stunt) {
            abilityDice = abilityDice + 2;
          }
          if (woundPenalty && data.health.penalty != 'inc') {
            abilityDice = abilityDice - data.health.penalty;
          }

          if (miscBonus) {
            abilityDice = abilityDice + miscBonus;
          }
          if (miscPenalty) {
            abilityDice = abilityDice - miscPenalty;
          }

          let dice = attributeDice + abilityDice;
          let roll = new Roll(`${dice}d10cs>=${singleSuccess}`).roll();
          let dice_roll = roll.dice[0].results;
          let bonus = "";
          let get_dice = "";
          for (let dice of dice_roll) {
            // comment out if no double successes
            if (dice.result >= doubleSuccess) { bonus++; }
            if (dice.result >= singleSuccess) { get_dice += `<li class="roll die d${dieNum} success">${dice.result}</li>`; }
            else { get_dice += `<li class="roll die d${dieNum}">${dice.result}</li>`; }
          }
          // if no double success uncomment below and remove the entry below that.
          //let total = roll.total;

          let total = roll.total;
          if (bonus) total += bonus;
          if (bonusSuccesses) total += bonusSuccesses;
          let the_content = `<div class="chat-card item-card"><div class="card-content">Dice Roll</div><div class="card-buttons"><div class="flexrow 1"><div>Dice Roller - Number of Successes<div class="dice-roll"><div class="dice-result"><div class="dice-formula">${roll.formula}</div><div class="dice-tooltip"><div class="dice"><ol class="dice-rolls">${get_dice}</ol></div></div><h4 class="dice-total">${total} Succeses</h4></div></div></div></div></div></div>`;
          ChatMessage.create({ user: game.user._id, speaker: ChatMessage.getSpeaker({ token: this.actor }), content: the_content, type: CONST.CHAT_MESSAGE_TYPES.OOC });
        }
      }
    }).render(true);
  }

  _calculateDoubleDice(html) {
    let doubleSevens = html.find('#double-sevens').is(':checked');
    let doubleEights = html.find('#double-eights').is(':checked');
    let doubleNines = html.find('#double-nines').is(':checked');
    let doubleTens = html.find('#double-tens').is(':checked');

    let doubleSuccess = 11;

    if (doubleSevens) {
      doubleSuccess = 7;
    }
    else if (doubleEights) {
      doubleSuccess = 8;
    }
    else if (doubleNines) {
      doubleSuccess = 9;
    }
    else if (doubleTens) {
      doubleSuccess = 10;
    }
    return doubleSuccess;
  }

  _onSquareCounterChange(event) {
    event.preventDefault()
    const element = event.currentTarget
    const index = Number(element.dataset.index)
    const oldState = element.dataset.state || ''
    const parent = $(element.parentNode)
    const data = parent[0].dataset
    const states = parseCounterStates(data.states)
    const fields = data.name.split('.')
    const steps = parent.find('.resource-counter-step')
    const fulls = Number(data[states['-']]) || 0
    const halfs = Number(data[states['/']]) || 0

    if (index < 0 || index > steps.length) {
      return
    }

    const allStates = ['', ...Object.keys(states)]
    const currentState = allStates.indexOf(oldState)
    if (currentState < 0) {
      return
    }

    const newState = allStates[(currentState + 1) % allStates.length]
    steps[index].dataset.state = newState

    if ((oldState !== '' && oldState !== '-') || (oldState !== '')) {
      data[states[oldState]] = Number(data[states[oldState]]) - 1
    }

    // If the step was removed we also need to subtract from the maximum.
    if (oldState !== '' && newState === '') {
      data[states['-']] = Number(data[states['-']]) - 1
    }

    if (newState !== '') {
      data[states[newState]] = Number(data[states[newState]]) + Math.max(index + 1 - fulls - halfs, 1)
    }

    const newValue = Object.values(states).reduce(function (obj, k) {
      obj[k] = Number(data[k]) || 0
      return obj
    }, {})

    this._assignToActorField(fields, newValue)
  }

  _onDotCounterChange(event) {
    event.preventDefault()
    const element = event.currentTarget
    const dataset = element.dataset
    const index = Number(dataset.index)
    const parent = $(element.parentNode)
    const fieldStrings = parent[0].dataset.name
    const fields = fieldStrings.split('.')
    const steps = parent.find('.resource-value-step')
    if (index < 0 || index > steps.length) {
      return
    }

    steps.removeClass('active')
    steps.each(function (i) {
      if (i <= index) {
        $(this).addClass('active')
      }
    })
    this._assignToActorField(fields, index + 1)
  }

  _assignToActorField(fields, value) {
    const actorData = duplicate(this.actor)
    // update actor owned items
    if (fields.length === 2 && fields[0] === 'items') {
      for (const i of actorData.items) {
        if (fields[1] === i._id) {
          i.data.points = value
          break
        }
      }
    } else {
      const lastField = fields.pop()
      fields.reduce((data, field) => data[field], actorData)[lastField] = value
    }
    this.actor.update(actorData)
  }

  _onDotCounterEmpty(event) {
    event.preventDefault()
    const element = event.currentTarget
    const parent = $(element.parentNode)
    const fieldStrings = parent[0].dataset.name
    const fields = fieldStrings.split('.')
    const steps = parent.find('.resource-value-empty')

    steps.removeClass('active')
    this._assignToActorField(fields, 0)
  }

  _setupDotCounters(html) {
    html.find('.resource-value').each(function () {
      const value = Number(this.dataset.value)
      $(this).find('.resource-value-step').each(function (i) {
        if (i + 1 <= value) {
          $(this).addClass('active')
        }
      })
    })
    html.find('.resource-value-static').each(function () {
      const value = Number(this.dataset.value)
      $(this).find('.resource-value-static-step').each(function (i) {
        if (i + 1 <= value) {
          $(this).addClass('active')
        }
      })
    })
  }

  _setupSquareCounters(html) {
    html.find('.resource-counter').each(function () {
      const data = this.dataset
      const states = parseCounterStates(data.states)

      const fulls = Number(data[states['-']]) || 0
      const halfs = Number(data[states['/']]) || 0

      const values = new Array(fulls + halfs)

      values.fill('/', 0, halfs)

      $(this).find('.resource-counter-step').each(function () {
        this.dataset.state = ''
        if (this.dataset.index < values.length) {
          this.dataset.state = values[this.dataset.index]
        }
      })
    })
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return this.actor.createOwnedItem(itemData);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    if (dataset.roll) {
      let roll = new Roll(dataset.roll, this.actor.data.data);
      let label = dataset.label ? `Rolling ${dataset.label}` : '';
      roll.roll().toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label
      });
    }
  }
}

function parseCounterStates(states) {
  return states.split(',').reduce((obj, state) => {
    const [k, v] = state.split(':')
    obj[k] = v
    return obj
  }, {})
}
