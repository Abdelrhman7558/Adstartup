import { X, Check, AlertCircle } from 'lucide-react';

const Comparison = () => {
  const comparisonData = [
    {
      feature: 'Campaign Execution',
      agencies: 'Manual, slow',
      tools: 'Requires expertise',
      adstartup: 'Fully automated',
    },
    {
      feature: 'Setup Time',
      agencies: '2-4 weeks',
      tools: 'Hours per campaign',
      adstartup: '5 minutes',
    },
    {
      feature: 'Monthly Cost',
      agencies: '$3,000 - $10,000+',
      tools: '$99 - $500 (+ your time)',
      adstartup: '$149 - $399',
    },
    {
      feature: 'Optimization',
      agencies: 'Periodic reviews',
      tools: 'Manual adjustments',
      adstartup: 'Real-time AI',
    },
    {
      feature: 'Ownership',
      agencies: 'Limited visibility',
      tools: 'Full ownership',
      adstartup: 'Full ownership',
    },
    {
      feature: 'Scaling',
      agencies: 'Requires approval',
      tools: 'Manual work',
      adstartup: 'Automatic',
    },
    {
      feature: 'Learning Curve',
      agencies: 'None (they do it)',
      tools: 'Steep',
      adstartup: 'None',
    },
  ];

  return (
    <div className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-red-600/10 border border-red-600/20 rounded-full px-4 py-2 mb-6">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-red-600 text-sm font-semibold">The Difference</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            The Ad Agent vs{' '}
            <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
              The Old Way
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how automated execution compares to traditional agencies and manual tools.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border-2 border-gray-200 rounded-2xl">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Feature
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">
                      Agencies
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-600 uppercase tracking-wider">
                      Tools
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-red-600 uppercase tracking-wider bg-red-50">
                      The Ad Agent
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comparisonData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {row.feature}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.agencies}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.tools}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600 bg-red-50">
                        {row.adstartup}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200">
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mb-6">
              <X className="w-6 h-6 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Agencies</h3>
            <p className="text-gray-600 mb-4">
              Expensive retainers, slow execution, and limited control over your own campaigns.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600 text-sm">Manual, slow processes</span>
              </li>
              <li className="flex items-start space-x-2">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600 text-sm">High monthly costs</span>
              </li>
              <li className="flex items-start space-x-2">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600 text-sm">Limited transparency</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 border-2 border-gray-200">
            <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center mb-6">
              <AlertCircle className="w-6 h-6 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Manual Tools</h3>
            <p className="text-gray-600 mb-4">
              Still requires expertise, constant monitoring, and manual optimization work.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600 text-sm">Steep learning curve</span>
              </li>
              <li className="flex items-start space-x-2">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600 text-sm">Manual adjustments</span>
              </li>
              <li className="flex items-start space-x-2">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600 text-sm">Time-intensive</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-8 border-2 border-red-600 shadow-lg shadow-red-600/25">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
              <Check className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">The Ad Agent</h3>
            <p className="text-red-100 mb-4">
              Fully automated execution with complete ownership and transparent results.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <span className="text-red-100 text-sm">Automated execution</span>
              </li>
              <li className="flex items-start space-x-2">
                <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <span className="text-red-100 text-sm">Affordable pricing</span>
              </li>
              <li className="flex items-start space-x-2">
                <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <span className="text-red-100 text-sm">Complete ownership</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comparison;
