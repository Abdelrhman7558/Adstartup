import { Clock, DollarSign, TrendingUp, Zap, Shield, Users } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const ValueProposition = () => {
  const problems = [
    {
      icon: Clock,
      title: 'Meta Ads Are Complex',
      description: 'Campaign structure, audience targeting, creative testing, and optimization require constant attention and expertise.',
    },
    {
      icon: DollarSign,
      title: 'Agencies Are Expensive & Slow',
      description: 'Monthly retainers, delayed responses, and limited transparency. Plus, you never truly own the strategy.',
    },
    {
      icon: TrendingUp,
      title: 'Scaling Requires Expertise',
      description: 'Manual budget adjustments, A/B testing, and performance monitoring consume hours every single day.',
    },
  ];

  const solutions = [
    {
      icon: Zap,
      title: 'Execute Automatically',
      description: 'AI creates, launches, and optimizes campaigns using your Meta Business Manager. No manual work required.',
      highlight: true,
    },
    {
      icon: Shield,
      title: 'Keep Full Ownership',
      description: 'Your ad account. Your data. Your results. The Ad Agent operates as your AI execution layer, not a middleman.',
      highlight: false,
    },
    {
      icon: Users,
      title: 'Scale With Confidence',
      description: 'Continuous optimization, automated budget allocation, and intelligent creative testing—all running 24/7.',
      highlight: false,
    },
  ];

  const headingRef = useScrollAnimation();
  const problemsRef = useScrollAnimation({ threshold: 0.2 });
  const solutionHeadingRef = useScrollAnimation({ threshold: 0.2 });
  const solutionsRef = useScrollAnimation({ threshold: 0.2 });

  return (
    <div className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div ref={headingRef.ref} className={`text-center mb-16 ${headingRef.isVisible ? 'animate-slide-up opacity-100' : 'opacity-0'}`}>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            The Meta Ads Problem
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Running profitable Meta campaigns requires constant optimization, expert knowledge, and time you don't have.
          </p>
        </div>

        <div ref={problemsRef.ref} className="grid md:grid-cols-3 gap-8 mb-24">
          {problems.map((problem, index) => (
            <div
              key={index}
              className={`group bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-8 hover:border-red-600 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${problemsRef.isVisible ? 'animate-slide-up opacity-100' : 'opacity-0'
                }`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:shadow-md transition-shadow">
                <problem.icon className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {problem.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {problem.description}
              </p>
            </div>
          ))}
        </div>

        <div ref={solutionHeadingRef.ref} className={`text-center mb-16 ${solutionHeadingRef.isVisible ? 'animate-slide-up opacity-100' : 'opacity-0'}`}>
          <div className="inline-flex items-center space-x-2 bg-red-600/10 border border-red-600/20 rounded-full px-4 py-2 mb-6">
            <Zap className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-semibold">The The Ad Agent Solution</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            AI-Powered Execution,{' '}
            <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
              Zero Manual Work
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            The Ad Agent doesn't just suggest what to do. It executes automatically using your Meta Business Manager.
          </p>
        </div>

        <div ref={solutionsRef.ref} className="grid md:grid-cols-3 gap-8">
          {solutions.map((solution, index) => (
            <div
              key={index}
              className={`relative bg-gradient-to-br ${solution.highlight
                  ? 'from-red-600 to-red-700 text-white'
                  : 'from-white to-gray-50 text-gray-900'
                } border-2 ${solution.highlight ? 'border-red-600' : 'border-gray-200'
                } rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${solutionsRef.isVisible ? 'animate-slide-up opacity-100' : 'opacity-0'
                }`}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {solution.highlight && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-black text-white text-xs font-bold px-3 py-1 rounded-full">
                    CORE FEATURE
                  </span>
                </div>
              )}
              <div
                className={`w-14 h-14 ${solution.highlight ? 'bg-white/20' : 'bg-red-50'
                  } rounded-xl flex items-center justify-center mb-6`}
              >
                <solution.icon
                  className={`w-7 h-7 ${solution.highlight ? 'text-white' : 'text-red-600'
                    }`}
                />
              </div>
              <h3
                className={`text-xl font-bold mb-3 ${solution.highlight ? 'text-white' : 'text-gray-900'
                  }`}
              >
                {solution.title}
              </h3>
              <p
                className={`leading-relaxed ${solution.highlight ? 'text-red-100' : 'text-gray-600'
                  }`}
              >
                {solution.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ValueProposition;
