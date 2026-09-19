const bodyParts = [
  {
    id: "face",
    name: "Face",
    icon: "◉"
  },
  {
    id: "neck",
    name: "Neck",
    icon: "◌"
  },
  {
    id: "arm",
    name: "Arm",
    icon: "◒"
  },
  {
    id: "hand",
    name: "Hand",
    icon: "✋"
  },
  {
    id: "chest",
    name: "Chest",
    icon: "♡"
  },
  {
    id: "back",
    name: "Back",
    icon: "▣"
  },
  {
    id: "leg",
    name: "Leg",
    icon: "│"
  },
  {
    id: "foot",
    name: "Foot",
    icon: "◡"
  },
  {
    id: "other",
    name: "Other visible area",
    icon: "＋"
  }
];

function BodyPartSelector({ onSelect }) {
  return (
    <div className="selector-section">
      <h2>What area are you checking?</h2>

      <div className="body-grid">
        {bodyParts.map((part) => (
          <button
            key={part.id}
            className="body-option"
            onClick={() => onSelect(part.id)}
          >
            <span className="body-icon">{part.icon}</span>
            <span>{part.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default BodyPartSelector;
