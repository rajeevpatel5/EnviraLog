import { Users, Cpu, Server, Database, Webcam, CheckSquare, Presentation, ExternalLink } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

interface TeamMember {
  initials: string;
  name: string;
  role: string;
  tasks: string[];
}

const teamMembers: TeamMember[] = [
  {
    initials: 'MK',
    name: 'Manis Khatri',
    role: 'Student - Computer Science',
    tasks: [
      'Design and develop Arduino sensor hardware setup',
      'Configure MQTT broker for real-time data transmission',
      'Develop machine learning model for environmental prediction',
      'Integrate ML model with backend system',
      'Set up PostgreSQL database schema and connections',
    ],
  },
  {
    initials: 'RP',
    name: 'Rajeev Patel',
    role: 'Student - Computer Science',
    tasks: [
      'Build Node.js REST API with Express',
      'Implement React frontend dashboard',
      'Create data visualization and prediction graphs',
      'Configure Postgres for database operations',
      'Complete system testing and debugging',
    ],
  },
];

const systemComponents = [
  {
    icon: Cpu,
    text: 'IoT Device Setup (Arduino Sensors)',
    href: 'https://www.arduino.cc/en/Guide/HomePage',
  },
  {
    icon: Server,
    text: 'Node.js Backend API',
    href: '/api/docs',
  },
  {
    icon: Cpu,
    text: 'XGBoost with MultiOutputRegressor',
    href: 'https://xgboost.readthedocs.io/en/stable/',
  },
  {
    icon: Database,
    text: 'PostgreSQL Database',
    href: 'https://www.postgresql.org/docs/',
  },
  {
    icon: Webcam,
    text: 'MQTT Broker (Real-time Data)',
    href: 'https://www.hivemq.com/docs/',
  },
  {
    icon: Users,
    text: 'React Frontend Dashboard',
    href: 'https://react.dev/docs/getting-started',
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="About Us"
        subtitle="Learn more about EnviroLog and our team"
      />

      {/* Project Description */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-brand-500 rounded-full" />
          About EnviroLog
        </h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          EnviroLog is an advanced environmental monitoring system that leverages IoT sensors
          and machine learning to provide real-time air quality, temperature, and humidity predictions.
          The system collects data from Arduino-based sensors, processes it through a Python-based
          ML forecasting model, and presents actionable insights through a modern web dashboard.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="px-3 py-1 text-xs font-medium bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full">
            IoT Sensors
          </span>
          <span className="px-3 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
            Machine Learning
          </span>
          <span className="px-3 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
            Real-time Monitoring
          </span>
          <span className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
            Predictive Analytics
          </span>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-500" />
          Our Team
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center">
                  <span className="text-brand-600 dark:text-brand-400 font-semibold text-sm">
                    {member.initials}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">{member.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{member.role}</p>
                </div>
              </div>
              <ul className="space-y-1.5">
                {member.tasks.map((task, idx) => (
                  <li key={idx} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <CheckSquare className="w-3.5 h-3.5 text-brand-500 mt-0.5 shrink-0" />
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Project Credits */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-brand-500" />
          Project Credits
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {systemComponents.map((comp, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                  <comp.icon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {comp.text}
                  </p>
                  {comp.href ? (
                    <a
                      href={comp.href}
                      target={comp.href.startsWith('/') ? '_self' : '_blank'}
                      rel={comp.href.startsWith('/') ? undefined : 'noreferrer noopener'}
                      className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300 dark:hover:text-brand-200"
                    >
                      Reference
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Academic Project */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Presentation className="w-5 h-5 text-brand-500" />
          Academic Project
        </h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
          CSCI 491 — Senior Seminar at McNeese State University.
          <br />
          Department of Engineering and Computer Science
        </p>
      </div>

      {/* Acknowledgements */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Acknowledgements
        </h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          Special thanks to Dr. Jennifer Lavergne for her continued mentorship and guidance throughout the project.
        </p>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          Client: Mr. Prithivi Singh
          <br />
          For providing valuable insights and feedback to shape the development of EnviroLog.
        </p>
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          © 2026 Group 3 — McNeese State University
        </p>
      </div>

      {/* Version Info */}
      <div className="text-center text-sm text-slate-400 dark:text-slate-500">
        <p>EnviroLog v1.1.0 • Environmental Monitoring System</p>
      </div>
    </div>
  );
}