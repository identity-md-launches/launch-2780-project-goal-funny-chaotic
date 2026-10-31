import { useEffect, useRef, useState } from "react";
import { HEADS, HANDS, EXTRAS, combo, type Outfit } from "../game/outfits";
import { drawHead, drawHand, drawHamster } from "../game/art";
import { Icon } from "./Icon";

function OutfitArt({ category, id }: { category: keyof Outfit; id: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvas.current?.getContext("2d");
    if (!c) return;
    c.clearRect(0, 0, 120, 100);
    c.save();
    if (category === "head") {
      c.translate(60, 123);
      c.scale(0.58, 0.58);
      drawHead(c, id as Outfit["head"]);
    } else if (category === "hand") {
      c.translate(60, 80);
      c.scale(0.61, 0.61);
      c.rotate(0.25);
      drawHand(c, id as Outfit["hand"]);
    } else if (id === "none") {
      c.strokeStyle = "#71816b";
      c.lineWidth = 3;
      c.beginPath();
      c.arc(60, 48, 23, 0, Math.PI * 2);
      c.moveTo(44, 64);
      c.lineTo(76, 32);
      c.stroke();
    } else {
      drawHamster(c, 60, 103, 0.46, {
        head: "sunglasses",
        hand: "spoon",
        extra: id as Outfit["extra"],
      });
    }
    c.restore();
  }, [category, id]);
  return <canvas ref={canvas} width={120} height={100} aria-hidden="true" />;
}
export function Wardrobe({
  outfit,
  setOutfit,
  locked,
}: {
  outfit: Outfit;
  setOutfit: (o: Outfit) => void;
  locked: boolean;
}) {
  const [category, setCategory] = useState<keyof Outfit>("head");
  const items =
    category === "head" ? HEADS : category === "hand" ? HANDS : EXTRAS;
  const selected = items.find((x) => x.id === outfit[category])!;
  const perk = combo(outfit);
  const randomize = () =>
    setOutfit({
      head: HEADS[Math.floor(Math.random() * HEADS.length)].id,
      hand: HANDS[Math.floor(Math.random() * HANDS.length)].id,
      extra: EXTRAS[Math.floor(Math.random() * EXTRAS.length)].id,
    });
  return (
    <aside className="wardrobe" id="wardrobe" aria-labelledby="wardrobe-title">
      <div className="section-title">
        <h2 id="wardrobe-title">Questionable drip</h2>
        <button
          className="icon-button"
          aria-label="Randomize outfit"
          disabled={locked}
          onClick={randomize}
        >
          <Icon name="shuffle" />
        </button>
      </div>
      <p className="muted wardrobe-intro">
        A little hamster. A lot of bad taste.
      </p>
      <div className="wardrobe-tabs" aria-label="Accessory category">
        {(["head", "hand", "extra"] as const).map((key, i) => (
          <button
            key={key}
            aria-pressed={category === key}
            onClick={() => setCategory(key)}
          >
            {["Headwear", "Handheld", "Extras"][i]}
          </button>
        ))}
      </div>
      <fieldset className="outfit-grid" disabled={locked}>
        <legend className="sr-only">
          Choose one{" "}
          {category === "head"
            ? "headwear item"
            : category === "hand"
              ? "handheld item"
              : "extra"}
        </legend>
        {items.map((item) => (
          <button
            key={item.id}
            aria-pressed={outfit[category] === item.id}
            className={`outfit-option ${outfit[category] === item.id ? "selected" : ""}`}
            onClick={() => setOutfit({ ...outfit, [category]: item.id })}
          >
            <OutfitArt category={category} id={item.id} />
            <span>{item.name}</span>
            {outfit[category] === item.id && (
              <span className="selected-tick">
                <Icon name="check" size={12} />
              </span>
            )}
          </button>
        ))}
      </fieldset>
      <p className="item-caption" role="status">
        {selected.subtitle}
      </p>
      <div className="combo">
        <Icon name="spark" />
        <div>
          <strong>{perk.name}</strong>
          <p>{perk.description}</p>
        </div>
      </div>
      {locked && (
        <p className="small muted">Finish this run to change your outfit.</p>
      )}
    </aside>
  );
}
