// Renders copy that names the public enquiry address with that address as a mail link.
export function EmailText({ text, email = 'contact@keliran.com' }: { text: string; email?: string }) {
  const [before, ...rest] = text.split(email)
  if (!rest.length) return <>{text}</>
  return (
    <>
      {before}
      <a href={`mailto:${email}`}>{email}</a>
      {rest.join(email)}
    </>
  )
}
