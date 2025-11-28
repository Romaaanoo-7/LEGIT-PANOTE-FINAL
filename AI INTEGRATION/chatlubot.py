import google.generativeai as genai

# ✅ Replace with your valid Gemini API key
API_KEY = "AIzaSyDClMDJYJjm4AaqfbfAdzfZL0vvBw_CpXY"  # don't hardcode your real key in production
genai.configure(api_key=API_KEY)

# Use Gemini model
model = genai.GenerativeModel('gemini-1.5-flash')  # you can switch to 2.0 or 2.5 if available

# Chatbot context
context = """You are a Virtual Study Buddy specialized in ICT (Information and Communication Technology).
Help students understand basic ICT concepts including: computer hardware/software, networks, 
programming basics, digital literacy, cybersecurity, databases, and web development.
Be friendly and explain concepts in simple terms with examples."""

def get_response(user_input, history):
    try:
        prompt = f"{context}\n\nConversation so far:\n{history}\nUser: {user_input}\nStudy Buddy:"
        response = model.generate_content(prompt)
        
        # ✅ Safely extract the text
        if hasattr(response, "text") and response.text:
            return response.text.strip()
        elif response.candidates and response.candidates[0].content.parts:
            return response.candidates[0].content.parts[0].text.strip()
        else:
            return "Hmm, I couldn't think of an answer just now."
    except Exception as e:
        return f"Sorry, I encountered an error: {str(e)}"

def main():
    print("\n" + "="*60)
    print("🎓 Virtual Study Buddy - ICT Helper 🎓".center(60))
    print("="*60)
    print("\nHello! I'm here to help you with ICT questions.")
    print("Type 'quit' to exit.\n")
    
    history = ""
    while True:
        user_input = input("You: ").strip()
        if user_input.lower() in ['quit', 'exit', 'bye']:
            print("\n👋 Goodbye! Happy studying!")
            break
        if not user_input:
            continue
        
        print("\nStudy Buddy: ", end="", flush=True)
        response = get_response(user_input, history)
        print(response)
        print()
        history += f"User: {user_input}\nStudy Buddy: {response}\n"

if __name__ == "__main__":
    main()
