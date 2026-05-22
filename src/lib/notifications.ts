import { createClient } from './supabase'

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendUpdateNotification(projectId: string, updateId: string) {
  const supabase = createClient()
  
  const { data: project } = await supabase
    .from('projects')
    .select('*, users!inner(email, office_name)')
    .eq('id', projectId)
    .single()

  if (!project?.client_email) return

  const { data: update } = await supabase
    .from('updates')
    .select('*, stages(name)')
    .eq('id', updateId)
    .single()

  const stageName = update?.stages?.name || 'Atualização'
  const projectName = project.name
  const officeName = project.users?.office_name || 'ObraSnap'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf9f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf9f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background-color: #5f5e5e; padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">${officeName}</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #2f342e; margin: 0 0 20px; font-size: 24px;">Nova atualização da obra!</h2>
                  
                  <p style="color: #5c605a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    O projeto <strong>${projectName}</strong> recebeu uma nova atualização.
                  </p>
                  
                  <div style="background-color: #f4f4ef; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <p style="color: #2f342e; margin: 0; font-size: 18px; font-weight: 600;">
                      ${stageName}
                    </p>
                    ${update?.note ? `<p style="color: #5c605a; margin: 10px 0 0; font-size: 14px;">${update.note}</p>` : ''}
                  </div>
                  
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/obra/${project.public_slug}" 
                     style="display: inline-block; background-color: #5f5e5e; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px;">
                    Ver Detalhes
                  </a>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f4f4ef; padding: 20px 30px; text-align: center;">
                  <p style="color: #787c75; font-size: 12px; margin: 0;">
                    Enviado por ${officeName} através do ObraSnap
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: project.client_email,
        subject: `Nova atualização - ${projectName}`,
        html
      })
    })
    
    return response.ok
  } catch (error) {
    console.error('Failed to send notification:', error)
    return false
  }
}
