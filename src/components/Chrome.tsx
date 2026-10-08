export function Grain() {
  return <div className="grain" aria-hidden="true" />
}

export function Letterbox() {
  return (
    <>
      <div className="lb lb--t" aria-hidden="true" />
      <div className="lb lb--b" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
    </>
  )
}

export function Rail() {
  return (
    <div className="rail" aria-hidden="true">
      <span className="rail__index" data-rail-index>
        00
      </span>
      <span className="rail__track">
        <span className="rail__fill" data-rail-fill />
      </span>
      <span className="rail__label" data-rail-label>
        Cut
      </span>
    </div>
  )
}