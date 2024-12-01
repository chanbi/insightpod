class ColorScale {
  constructor(min, max, colors) {
    this.min = min
    this.max = max
    this.colors = colors
  }

  getColor(value) {
    if (!value || value === 0) {
      return 'rgba(255, 255, 255, 0)'
    }

    const percentage = (value - this.min) / (this.max - this.min)
    const index = Math.min(Math.floor(percentage * (this.colors.length - 1)), this.colors.length - 2)
    const t = (percentage - index / (this.colors.length - 1)) * (this.colors.length - 1)

    return this.interpolateColor(this.colors[index], this.colors[index + 1], t)
  }

  interpolateColor(color1, color2, t) {
    const r = Math.round(color1.r + (color2.r - color1.r) * this.roundToHalf(t))
    const g = Math.round(color1.g + (color2.g - color1.g) * this.roundToHalf(t))
    const b = Math.round(color1.b + (color2.b - color1.b) * this.roundToHalf(t))

    return `rgba(${r}, ${g}, ${b}, 0.5)`
  }

  roundToHalf(value) {
    return Math.round((value + Number.EPSILON) * 2) / 2
  }
}

const gyrColors = [
  { r: 0, g: 255, b: 0 },    // Green
  { r: 255, g: 255, b: 0 },  // Yellow
  { r: 255, g: 0, b: 0 }     // Red
]

function applyColorScale(value, minValue = 0, maxValue = 100, colors = gyrColors) {
  const colorScale = new ColorScale(minValue, maxValue, colors)
  const color = colorScale.getColor(value)
  return `background-color: ${color};`
}

function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2

  if (max === min) {
    h = s = 0 // achromatic
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }

  return [h * 360, s * 100, l * 100]
}

function rgbStrToColor(str) {
  return { 
    r: parseInt(str.match(/\d+/g)[0]),
    g: parseInt(str.match(/\d+/g)[1]),
    b: parseInt(str.match(/\d+/g)[2])
  }
}

function sortColors(c1, c2) {
  const [h1, s1, l1] = rgbToHsl(c1.r, c1.g, c1.b)
  const [h2, s2, l2] = rgbToHsl(c2.r, c2.g, c2.b)
  if (h1 !== h2) return h2 - h1
  if (s1 !== s2) return s2 - s1
  return l1 - l2
}