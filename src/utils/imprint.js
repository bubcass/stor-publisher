export const IMPRINTS = {
  PBO: { code: "PBO", title: "Parliamentary Budget Office" },
  LRS: { code: "LRS", title: "Library and Research Service" },
  COM: { code: "COM", title: "Committees" },
  CMSN: { code: "CMSN", title: "Commission" },
  COMMS: { code: "COMMS", title: "Communications" },
  OTHER: { code: "OTHER", title: "Other" },
};

export const unitFromCode = (code) =>
  IMPRINTS[code]?.title || IMPRINTS.OTHER.title;
// Optional placeholder for future committee registry:
export const COMMITTEES = [
  // { code: 'COM-FIN', title: 'Committee on Finance' },
];
