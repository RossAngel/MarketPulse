import React, { useState } from 'react';
import "./styles.css";
export default function JsonViewer({ data }) {
  const [show, setShow] = useState(false);

  if (!data) return null;

  return (
    <div className="json-viewer">
      <button 
        onClick={() => setShow(!show)} 
        className="btn"
      >
        {show ? (
          <>
            <i className="fas fa-chevron-up"></i> Hide Full JSON
          </>
        ) : (
          <>
            <i className="fas fa-chevron-down"></i> Show Full JSON
          </>
        )}
      </button>
      {show && (
        <pre className="json-content">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}