export const scrollToElement = (
  event: React.MouseEvent<HTMLElement>,
  id: string,
) => {
  event.preventDefault();

  const element = document.getElementById(id);
  element?.scrollIntoView({ behavior: "smooth" });
};
