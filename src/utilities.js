/**
 * Convert degree value to radian value.
 * @param {float} degree - degree of circle
 * @returns A float representing the specified degree in radians.
 */
function degreesToRadians(degree) {
    return degree * (Math.PI/180);
}

export { degreesToRadians }
