import { useState } from "react";
import "./Tabs.css"; // <-- import the CSS file

export default function Tabs({ tabs }) {
  const [active, setActive] = useState(0);

  return (
    <div className="tabs-container">
      {/* Tab Buttons */}
      <div className="tabs-header">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`tab-button ${active === i ? "active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">{tabs[active].content}</div>
    </div>
  );
}
