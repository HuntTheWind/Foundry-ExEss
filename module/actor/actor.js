/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ExaltedessenceActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareBaseData() {
    super.prepareBaseData();

    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'character') this._prepareCharacterData(actorData);
    if (actorData.type === 'npc') this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    // Make modifications to data here. For example:
    const data = actorData.data;
    this._prepareBaseActorData(data);
    let totalHealth = 0;
    let currentPenalty = 0;
    data.motes.total = data.essence.value * 2 + Math.floor((data.essence.value - 1) / 2) + 3;
    for (let [key, health_level] of Object.entries(data.health.levels)) {
      if ((data.health.lethal + data.health.aggravated) > totalHealth) {
        currentPenalty = health_level.penalty;
      }
      totalHealth += health_level.value;
    }
    data.health.total = totalHealth;
    if (data.health.aggravated + data.health.lethal > data.health.total) {
      data.health.aggravated = data.health.total - data.health.lethal
      if (data.health.aggravated <= 0) {
        data.health.aggravated = 0
        data.health.lethal = data.health.total
      }
    }
    data.health.penalty = currentPenalty;
  }

  _prepareNpcData(actorData) {
    const data = actorData.data;
    this._prepareBaseActorData(data);
    let currentPenalty = 0;
    if ((data.health.lethal + data.health.aggravated) >= Math.floor(data.health.levels / 2)) {
      currentPenalty = 2;
    }
    data.health.penalty = currentPenalty;
  }

  _prepareBaseActorData(data) {
    data.motes.total = data.essence.value * 2 + Math.floor((data.essence.value - 1) / 2) + 3;
    let animaLevel = "";
    if (data.anima.value >= 1) {
      animaLevel = "dim";
    }
    if (data.anima.value >= 3) {
      animaLevel = "glowing";
    }
    if (data.anima.value >= 5) {
      animaLevel = "burning";
    }
    if (data.anima.value >= 7) {
      animaLevel = "bonfire";
    }
    if (data.anima.value === 10) {
      animaLevel = "iconic";
    }
    data.anima.level = animaLevel;
  }
}
