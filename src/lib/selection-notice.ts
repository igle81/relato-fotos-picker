export function rankedSelectionNotice(added: number) {
  const entraron = added === 1 ? "Entró 1 foto" : `Entraron ${added} fotos`;
  return `${entraron} en la bandeja. El orden es por fecha, de la más reciente a la más antigua, solo entre las que tú elegiste. Si falta la fecha, esa foto queda detrás. No se mira el resto del rollo.`;
}
