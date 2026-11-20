/** o @ guarda maiúsculas, mas "Ana" e "ana" são o mesmo perfil (o backend compara sem diferenciar) */
export function sameUsername(a: string | null | undefined, b: string | null | undefined): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}
