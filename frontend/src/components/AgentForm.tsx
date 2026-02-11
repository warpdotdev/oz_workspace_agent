'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, CreateAgentInput, AgentConfiguration } from '@/lib/api';

interface AgentFormProps {
  initialData?: Partial<CreateAgentInput>;
  agentId?: string;
  mode: 'create' | 'edit';
}

const FRAMEWORKS = [
  { value: 'langchain', label: 'LangChain', description: 'Popular Python framework for LLM apps' },
  { value: 'crewai', label: 'CrewAI', description: 'Multi-agent orchestration framework' },
  { value: 'autogpt', label: 'AutoGPT', description: 'Autonomous agent framework' },
  { value: 'openai', label: 'OpenAI API', description: 'Direct OpenAI API integration' },
  { value: 'anthropic', label: 'Anthropic API', description: 'Claude API integration' },
  { value: 'custom', label: 'Custom', description: 'Custom implementation' },
];

const MODELS = [
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
];

const CAPABILITIES = [
  'code-generation',
  'code-review',
  'testing',
  'documentation',
  'data-analysis',
  'web-search',
  'file-management',
  'api-integration',
];

export function AgentForm({ initialData, agentId, mode }: AgentFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [framework, setFramework] = useState(initialData?.configuration?.framework || '');
  const [model, setModel] = useState(initialData?.configuration?.model || '');
  const [temperature, setTemperature] = useState(initialData?.configuration?.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(initialData?.configuration?.maxTokens || 4096);
  const [systemPrompt, setSystemPrompt] = useState(initialData?.configuration?.systemPrompt || '');
  const [capabilities, setCapabilities] = useState<string[]>(initialData?.capabilities || []);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isStepValid = (stepNum: number) => {
    if (stepNum === 1) return name.trim().length > 0 && description.trim().length > 0;
    if (stepNum === 2) return framework.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    if (!isStepValid(1) || !isStepValid(2)) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    const configuration: AgentConfiguration = {
      framework,
      model: model || undefined,
      temperature,
      maxTokens,
      systemPrompt: systemPrompt || undefined,
    };

    const input: CreateAgentInput = {
      name: name.trim(),
      description: description.trim(),
      capabilities,
      configuration,
    };

    try {
      let result;
      if (mode === 'create') {
        result = await api.createAgent(input);
      } else if (agentId) {
        result = await api.updateAgent(agentId, input);
      }

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/agents');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleCapability = (cap: string) => {
    setCapabilities(prev =>
      prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap]
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <button
                onClick={() => s < step && setStep(s)}
                disabled={s > step}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  s === step
                    ? 'bg-blue-600 text-white'
                    : s < step
                    ? 'bg-green-500 text-white cursor-pointer'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s < step ? '✓' : s}
              </button>
              {s < 3 && (
                <div
                  className={`w-24 h-1 mx-2 ${
                    s < step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Basic Info</span>
          <span>Framework</span>
          <span>Configuration</span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
          <p className="text-gray-600">Give your agent a name and description.</p>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Agent Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Code Review Assistant"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this agent does..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!isStepValid(1)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Framework Selection */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Select Framework</h2>
          <p className="text-gray-600">Choose the framework your agent is built with.</p>

          <div className="grid grid-cols-2 gap-4">
            {FRAMEWORKS.map((fw) => (
              <button
                key={fw.value}
                onClick={() => setFramework(fw.value)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  framework === fw.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{fw.label}</div>
                <div className="text-sm text-gray-500 mt-1">{fw.description}</div>
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!isStepValid(2)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Configuration */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Configuration</h2>
          <p className="text-gray-600">Configure your agent&apos;s capabilities and settings.</p>

          {/* Capabilities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capabilities
            </label>
            <div className="flex flex-wrap gap-2">
              {CAPABILITIES.map((cap) => (
                <button
                  key={cap}
                  onClick={() => toggleCapability(cap)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    capabilities.includes(cap)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cap}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-700"
          >
            <span className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>
              ▶
            </span>
            <span className="ml-2">Advanced Configuration</span>
          </button>

          {/* Advanced options (progressive disclosure) */}
          {showAdvanced && (
            <div className="space-y-4 pl-4 border-l-2 border-blue-200">
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <select
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a model</option>
                  {MODELS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature: {temperature}
                </label>
                <input
                  type="range"
                  id="temperature"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Precise (0)</span>
                  <span>Creative (2)</span>
                </div>
              </div>

              <div>
                <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700 mb-1">
                  Max Tokens
                </label>
                <input
                  type="number"
                  id="maxTokens"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  min="256"
                  max="128000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 mb-1">
                  System Prompt
                </label>
                <textarea
                  id="systemPrompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Optional custom system prompt..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Agent' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
