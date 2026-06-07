import {
  isNaukriApplyEmail,
  isNaukriStatusEmail,
  parseNaukriStatusBody,
  parseNaukriStatusContent,
  parseNaukriStatusHtml,
} from './naukri-status.parser';

const STATUS_SUBJECT =
  'Status of your job application has been updated';
const MESSAGE_DATE = new Date('2026-06-02T15:27:00.000Z');

describe('naukri-status.parser', () => {
  it('matches only info@naukri.com status emails', () => {
    expect(isNaukriApplyEmail('Naukri <info@naukri.com>')).toBe(true);
    expect(
      isNaukriStatusEmail(
        'Naukri <info@naukri.com>',
        'Status of your job application has changed',
      ),
    ).toBe(true);
    expect(
      isNaukriStatusEmail(
        'Naukri <info@naukri.com>',
        STATUS_SUBJECT,
      ),
    ).toBe(true);
    expect(
      isNaukriStatusEmail(
        'Naukri Alerts <noreply@naukri.com>',
        STATUS_SUBJECT,
      ),
    ).toBe(false);
  });

  it('parses role, company, and location from status email body', () => {
    const body = `
Hi Jaswinder Singh,
Status of your job application has been updated
View status
Front End Developer
Hiringeye Solutions
Chennai
Applied 1d ago
Explore our blogs to stand out
`;

    expect(parseNaukriStatusBody(body, MESSAGE_DATE)).toEqual({
      role: 'Front End Developer',
      company: 'Hiringeye Solutions',
      location: 'Chennai',
      appliedAt: new Date('2026-06-01T00:00:00.000Z'),
    });
  });

  it('parses from HTML table layout', () => {
    const html = `
      <table>
        <tr>
          <td><strong>Front End Developer</strong></td>
        </tr>
        <tr>
          <td>Hiringeye Solutions</td>
          <td>Chennai</td>
        </tr>
        <tr>
          <td>Applied 1d ago</td>
        </tr>
      </table>
    `;

    expect(parseNaukriStatusHtml(html, MESSAGE_DATE)).toEqual({
      role: 'Front End Developer',
      company: 'Hiringeye Solutions',
      location: 'Chennai',
      appliedAt: new Date('2026-06-01T00:00:00.000Z'),
    });
  });

  it('prefers html content in parseNaukriStatusContent', () => {
    const result = parseNaukriStatusContent({
      plainText: '',
      html: `
        Status of your job application has been updated
        <div>Front End Developer</div>
        <div>Hiringeye Solutions</div>
        <div>Chennai</div>
        <div>Applied 1d ago</div>
      `,
      htmlAsText: '',
      messageDate: MESSAGE_DATE,
    });

    expect(result.source).toBe('html');
    expect(result.application).toEqual({
      role: 'Front End Developer',
      company: 'Hiringeye Solutions',
      location: 'Chennai',
      appliedAt: new Date('2026-06-01T00:00:00.000Z'),
    });
  });
});
