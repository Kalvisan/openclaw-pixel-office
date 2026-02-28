interface Preset {
  id: string;
  name: string;
}

interface Props {
  presets: Preset[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export function PresetSelector({ presets, selected, onSelect }: Props) {
  return (
    <div className="preset-buttons">
      {presets.map((p) => (
        <button
          key={p.id}
          className={selected === p.id ? "game-btn" : "game-btn game-btn-secondary"}
          onClick={() => onSelect(p.id)}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}
