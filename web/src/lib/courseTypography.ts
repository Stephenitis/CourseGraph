/** Every course uses the same 4:3 landscape footprint, regardless of title length. */
export const COURSE_CARD_WIDTH=336;
export const COURSE_CARD_HEIGHT=252;

export function getCourseTitleTypography(title:string,stage:string){
  const advanced=stage==='advanced'||stage==='graduate';
  const fontSize=title.length<=20?28:title.length<=42?25:23;
  return {fontSize,fontWeight:advanced?800:700,fontFamily:advanced?'Manrope':'DM Sans',lineHeight:1.18};
}
