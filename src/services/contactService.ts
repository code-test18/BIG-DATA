const API_URL = import.meta.env.VITE_API_URL || 'https://backend-api-production-6a5a.up.railway.app';

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    return Promise.resolve(null);
  }

  return response.json().catch(() => null);
}

export async function sendContactMessage(payload: ContactPayload): Promise<{ message: string }> {
  try {
    const response = await fetch(`${API_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await parseResponseBody(response);

    if (!response.ok) {
      throw new Error((data as { message?: string } | null)?.message || `Error ${response.status}`);
    }

    return {
      message: (data as { message?: string } | null)?.message || 'Mensaje enviado correctamente.',
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'No se pudo enviar el mensaje.');
  }
}
