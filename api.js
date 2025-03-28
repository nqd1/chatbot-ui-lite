const API_URL = process.env.REACT_APP_API_URL;

async function simulateStreaming(text, onStream, delay = 50) {
  const sentences = text.split(/([.!?]+)/);
  let fullText = '';
  
  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i] + (sentences[i + 1] || '');
    fullText += sentence;
    onStream(sentence);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  return fullText;
}

async function run(prompt, roleConfig = null, onStream = null) {
  try {
    console.log("Starting API call with prompt:", prompt);
    
    const response = await fetch(`${API_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const fullText = data.response || data.message || "Không thể xử lý yêu cầu của bạn";

    if (onStream) {
      return await simulateStreaming(fullText, onStream);
    } else {
      return fullText;
    }

  } catch (error) {
    console.error("Error in API call:", error);
    return "Error: " + (error.message || "Unknown error occurred");
  }
}

export default run; 