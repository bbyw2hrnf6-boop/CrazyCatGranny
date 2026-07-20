const WORLD_ARCS = Object.freeze({
  1: {
    opening: "A quiet afternoon shatters when the Cat Thief sweeps through Granny’s neighborhood.",
    thief: "Forty-five cats, one perfect getaway. Try to keep up, Granny!",
    granny: "You picked the wrong street—and the wrong grandmother.",
    rescue: "The neighborhood cats leave a trail of treats and pawprints for Granny to follow.",
    boss: "The rooftops end here. My getaway machine will shake you off!"
  },
  2: {
    opening: "The chase spills across canals and windmills, but the rescued cats point Granny east.",
    thief: "New roads, stronger winds. Surely those old skates are tired?",
    granny: "These skates have crossed worse weather than your excuses.",
    rescue: "A brave canal cat calls from the thief’s rattling carrier.",
    boss: "The windmill is mine! One gust and you’re going straight into the canal."
  },
  3: {
    opening: "Lanterns glow through the rain as the Cat Thief disappears into a maze of neon streets.",
    thief: "Every light makes another shadow. You’ll never know which way I went.",
    granny: "I don’t need the lights. I can hear forty-five very annoyed cats.",
    rescue: "A tiny voice cuts through the monsoon and guides Granny toward the next lantern.",
    boss: "Wake the neon dragon! Let’s see her skate through fire and thunder."
  },
  4: {
    opening: "The trail crosses an ocean and lands in a city that never slows down.",
    thief: "You still think this was my plan? Someone much grander is waiting at the finish.",
    granny: "Then I’ll rescue the cats, catch you, and ask your mysterious friend myself.",
    rescue: "Between subway rumbles, another captured cat sends Granny a fearless meow.",
    boss: "No more clues! The city is big enough for me to vanish forever."
  },
  5: {
    opening: "At midnight, every pawprint leads to Maestro’s carnival—the heart of the whole scheme.",
    thief: "Maestro promised the greatest chase ever staged. You were always the star, Granny.",
    granny: "A show built on stolen cats deserves a very short final act.",
    rescue: "Behind the carnival lights, the last captives are waiting for Granny’s signal.",
    boss: "The maze, the lights, the whole world tour—it all leads to Maestro’s last run!"
  }
});

export function storyForLevel(level) {
  if (!level) return null;
  const arc = WORLD_ARCS[level.world];
  if (!arc) return null;
  if (level.worldStep === 1) {
    return {
      id: `world-${level.world}-opening`,
      kicker: `WORLD ${level.world} · CHAPTER OPENING`,
      title: level.title,
      beats: [
        { speaker: "NARRATOR", actor: "narrator", text: arc.opening },
        { speaker: "CAT THIEF", actor: "thief", text: arc.thief },
        { speaker: "GRANNY", actor: "granny", text: arc.granny }
      ]
    };
  }
  if (level.boss) {
    const finalWorld = level.world === 5;
    return {
      id: `world-${level.world}-boss`,
      kicker: finalWorld ? "THE FINAL ACT" : `WORLD ${level.world} · SHOWDOWN`,
      title: level.title,
      beats: [
        { speaker: "CAT THIEF", actor: "thief", text: arc.boss },
        {
          speaker: level.cat.name.toUpperCase(),
          actor: "cat",
          text: finalWorld
            ? "We kept calling so you could find us. Finish the chase, Granny!"
            : "The weak spots glow before every attack. That’s your opening!"
        },
        {
          speaker: "GRANNY",
          actor: "granny",
          text: finalWorld ? "Curtain call, Maestro. Every cat is coming home." : "Three clean hits. One rescued world. Let’s roll."
        }
      ]
    };
  }
  if (level.grantsCat) {
    return {
      id: `rescue-${level.cat.id}`,
      kicker: `CAT RESCUE · ${level.cat.name.toUpperCase()}`,
      title: level.title,
      beats: [
        { speaker: "NARRATOR", actor: "narrator", text: arc.rescue },
        { speaker: level.cat.name.toUpperCase(), actor: "cat", text: `Granny! I can see a safe route through ${level.title.toLowerCase()}!` },
        { speaker: "GRANNY", actor: "granny", text: `Hold tight, ${level.cat.name}. This chase ends with you safely home.` }
      ]
    };
  }
  return null;
}
