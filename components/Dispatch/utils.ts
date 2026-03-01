export const CHART_COLORS = {
  red: "rgb(255, 99, 132)",
  blue: "rgb(54, 162, 235)",
  green: "rgb(75, 192, 192)",
  orange: "rgb(255, 159, 64)",
};

export function transparentize(color: string, opacity: number) {
  const rgb = color.match(/\d+/g);
  if (!rgb || rgb.length < 3) return color;
  const alpha = 1 - opacity;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

export function months(count: number) {
  const base = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return base.slice(0, count);
}

export function numbers(config: { count: number; min: number; max: number }) {
  const { count, min, max } = config;
  const values: number[] = [];

  for (let i = 0; i < count; i += 1) {
    const value = Math.round(min + Math.random() * (max - min));
    values.push(value);
  }

  return values;
}

