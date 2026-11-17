import { matchesFileTypes } from './application-documents.service';

describe('matchesFileTypes', () => {
  it('accepts anything when the requirement lists no types', () => {
    expect(matchesFileTypes([], 'a.exe', 'application/x-msdownload')).toBe(true);
  });
  it('judges by extension first', () => {
    expect(matchesFileTypes(['pdf'], 'passport.PDF', 'application/pdf')).toBe(true);
    expect(matchesFileTypes(['pdf'], 'passport.png', 'image/png')).toBe(false);
    expect(matchesFileTypes(['.jpg'], 'photo.jpeg', 'image/jpeg')).toBe(true);
  });
  it('falls back to the MIME type', () => {
    expect(matchesFileTypes(['pdf'], 'Passport scan', 'application/pdf')).toBe(true);
    expect(matchesFileTypes(['pdf'], 'Passport scan', 'image/png')).toBe(false);
    expect(matchesFileTypes(['image/*'], 'scan', 'image/png')).toBe(true);
  });
  it('lets an unknown type through', () => {
    expect(matchesFileTypes(['pdf'], 'Passport scan', '')).toBe(true);
  });
});
