export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="blob animate-drift-a -top-[12vh] -left-[10vw] size-[55vmax] bg-(--blob-1)" />
      <div className="blob animate-drift-b top-[30vh] -right-[18vw] size-[50vmax] bg-(--blob-2) opacity-60" />
      <div className="blob animate-drift-c -bottom-[25vh] left-[15vw] size-[45vmax] bg-(--blob-3) opacity-50" />
    </div>
  )
}
