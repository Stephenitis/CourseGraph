/** Local prototype identity; this does not represent an authenticated account. */
const displayName='Stephen Nguyen';
export const localProfile={
  displayName,
  firstName:displayName.split(/\s+/)[0],
  possessiveName:`${displayName.split(/\s+/)[0]}’s`,
  avatarUrl:'/images/student-profile-placeholder.png',
  initials:displayName.split(/\s+/).map(part=>part[0]).join(''),
};
