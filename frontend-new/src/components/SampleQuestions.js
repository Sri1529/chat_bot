import React, { useState } from 'react';
import { MessageCircle, Sparkles, TrendingUp, Brain, Heart, DollarSign } from 'lucide-react';

const SampleQuestions = ({ onQuestionClick, isVisible }) => {
  const [activeCategory, setActiveCategory] = useState('all');

  const questionCategories = {
    all: {
      icon: <MessageCircle className="w-5 h-5" />,
      title: "All Questions",
      questions: [
        "What are the latest developments in artificial intelligence?",
        "How is AI being used in healthcare?",
        "Tell me about recent AI breakthroughs",
        "What are the current trends in machine learning?",
        "How is AI transforming different industries?",
        "What are the ethical concerns with AI?"
      ]
    },
    ai: {
      icon: <Brain className="w-5 h-5" />,
      title: "AI & Technology",
      questions: [
        "What are the latest AI developments?",
        "Tell me about machine learning advances",
        "How is natural language processing evolving?",
        "What's new in robotics?",
        "Explain recent AI breakthroughs",
        "What are the challenges in AI development?"
      ]
    },
    healthcare: {
      icon: <Heart className="w-5 h-5" />,
      title: "Healthcare AI",
      questions: [
        "How is AI being used in medical diagnosis?",
        "Tell me about AI in drug discovery",
        "What are AI applications in healthcare?",
        "How is AI improving patient care?",
        "What are AI-powered medical devices?",
        "How is AI helping with medical imaging?"
      ]
    },
    finance: {
      icon: <DollarSign className="w-5 h-5" />,
      title: "Finance & AI",
      questions: [
        "How is AI used in financial services?",
        "Tell me about AI in trading",
        "What are fintech innovations?",
        "How is AI improving banking?",
        "What are AI risk assessment tools?",
        "How is AI changing payment systems?"
      ]
    },
    trends: {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Trends & Future",
      questions: [
        "What are the top AI trends this year?",
        "Tell me about emerging technologies",
        "What does the future of AI look like?",
        "How will AI evolve in the next decade?",
        "What are the predictions for AI?",
        "How will AI impact society?"
      ]
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-semibold text-gray-800">Sample Questions</h3>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(questionCategories).map(([key, category]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === key
                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category.icon}
            {category.title}
          </button>
        ))}
      </div>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {questionCategories[activeCategory].questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className="text-left p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0 group-hover:bg-purple-600"></div>
              <p className="text-gray-700 group-hover:text-purple-800 text-sm leading-relaxed">
                {question}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>💡 Tip:</strong> You can ask about any topic related to AI, technology, healthcare, finance, or current events. 
          The AI will search through recent news articles to provide you with up-to-date information.
        </p>
      </div>
    </div>
  );
};

export default SampleQuestions;
