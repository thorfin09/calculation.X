'use client';

import React, { useState } from 'react';
import { BookOpen, Table, Flame, BarChart2, Star, Check } from 'lucide-react';
import styles from './tricks.module.css';

export default function Tricks() {
  const [activeTab, setActiveTab] = useState<'tables' | 'squares' | 'cubes' | 'fractions' | 'tricks'>('tricks');
  const [tableNumber, setTableNumber] = useState<number>(12); // multiplication table selection

  const vedicTricks = [
    {
      title: 'Multiplying Any 2-Digit Number by 11',
      category: 'multiplication',
      desc: 'Quickly multiply any 2-digit number by 11 by adding its two digits together and placing the sum in the middle.',
      example: 'Multiply 45 × 11',
      steps: [
        'Separate the digits 4 and 5: 4 [ ] 5',
        'Add the two digits together: 4 + 5 = 9',
        'Place the sum in the middle: 495',
        'If the sum is 10 or greater (e.g., 85 × 11, 8+5=13), put the 3 in the middle and carry over the 1 to the first digit: 85 × 11 = (8+1) [3] 5 = 935.'
      ]
    },
    {
      title: 'Squaring Numbers Ending in 5',
      category: 'squares',
      desc: 'Find the square of any number ending in 5. The last two digits of the answer will always be 25. The preceding digits are found by multiplying the remaining number by itself plus 1.',
      example: 'Square of 75 (75²)',
      steps: [
        'The answer ends in 25: [ ][ ]25',
        'Take the first digit (7) and multiply it by its consecutive successor (7 + 1 = 8): 7 × 8 = 56',
        'Join the two parts together: 5625',
        'Works for large numbers too! E.g. 115² = (11 × 12) [25] = 13225.'
      ]
    },
    {
      title: 'Multiplication Near Base 100 (Vedic Method)',
      category: 'multiplication',
      desc: 'Multiply two numbers that are close to 100 by checking their deviations from 100. This is exceptionally fast for numbers in the 90s.',
      example: 'Multiply 96 × 93',
      steps: [
        'Find deviation from 100: 96 is -4, 93 is -7.',
        'Cross-subtract to find the first part: 96 - 7 = 89 (or 93 - 4 = 89). First two digits: 89[ ][ ]',
        'Multiply deviations to find the last two digits: (-4) × (-7) = 28.',
        'Combine the results: 8928'
      ]
    },
    {
      title: 'Fraction to Percent Conversion Equivalents',
      category: 'percentages',
      desc: 'Memorizing primary fraction-to-percentage conversions saves crucial time in Data Interpretation, Profit & Loss, and compound interest calculations.',
      example: 'Visualizing Eighths (1/8 series)',
      steps: [
        '1/8 = 12.5%',
        '2/8 (1/4) = 25%',
        '3/8 = 37.5%',
        '4/8 (1/2) = 50%',
        '5/8 = 62.5%',
        '6/8 (3/4) = 75%',
        '7/8 = 87.5%'
      ]
    }
  ];

  const fractionList = [
    { frac: '1/2', dec: '0.50', pct: '50.0%' },
    { frac: '1/3', dec: '0.333...', pct: '33.3%' },
    { frac: '2/3', dec: '0.666...', pct: '66.7%' },
    { frac: '1/4', dec: '0.25', pct: '25.0%' },
    { frac: '3/4', dec: '0.75', pct: '75.0%' },
    { frac: '1/5', dec: '0.20', pct: '20.0%' },
    { frac: '2/5', dec: '0.40', pct: '40.0%' },
    { frac: '3/5', dec: '0.60', pct: '60.0%' },
    { frac: '4/5', dec: '0.80', pct: '80.0%' },
    { frac: '1/6', dec: '0.166...', pct: '16.7%' },
    { frac: '5/6', dec: '0.833...', pct: '83.3%' },
    { frac: '1/8', dec: '0.125', pct: '12.5%' },
    { frac: '3/8', dec: '0.375', pct: '37.5%' },
    { frac: '5/8', dec: '0.625', pct: '62.5%' },
    { frac: '7/8', dec: '0.875', pct: '87.5%' },
    { frac: '1/9', dec: '0.111...', pct: '11.1%' },
    { frac: '1/10', dec: '0.10', pct: '10.0%' },
    { frac: '1/11', dec: '0.0909...', pct: '9.09%' },
    { frac: '1/12', dec: '0.0833...', pct: '8.33%' }
  ];

  // Helper arrays
  const tableValues = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12 multipliers
  const squareValues = Array.from({ length: 29 }, (_, i) => i + 2); // squares of 2 to 30
  const cubeValues = Array.from({ length: 19 }, (_, i) => i + 2); // cubes of 2 to 20

  return (
    <div className={styles.container + ' animate-fade'}>
      <header className={styles.header}>
        <h1 className={styles.title}>Vedic Tricks & Reference Library</h1>
        <p className={styles.subtitle}>Memorize math pathways, tables, and shortcuts to bypass calculations</p>
      </header>

      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          { id: 'tricks', label: 'Speed Math Shortcuts', icon: Star },
          { id: 'tables', label: 'Multiplication Tables', icon: Table },
          { id: 'squares', label: 'Squares (1-30)', icon: BookOpen },
          { id: 'cubes', label: 'Cubes (1-20)', icon: BookOpen },
          { id: 'fractions', label: 'Fraction Percentages', icon: BarChart2 }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={activeTab === tab.id ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content tabs rendering */}

      {/* TAB 1: Vedic Tricks */}
      {activeTab === 'tricks' && (
        <section className={styles.tricksList}>
          {vedicTricks.map((trick, index) => (
            <div key={index} className="glass-card + styles.trickCard">
              <div className={styles.trickHeader}>
                <h3 className={styles.trickTitle}>{trick.title}</h3>
                <span className={styles.trickCategory}>{trick.category}</span>
              </div>
              <p className={styles.trickDesc}>{trick.desc}</p>
              
              <div className={styles.trickExample}>
                <div className={styles.trickExampleTitle}>Example breakdown: {trick.example}</div>
                <div className={styles.trickSteps}>
                  {trick.steps.map((step, sIdx) => (
                    <div key={sIdx} className={styles.trickStep}>
                      <span className={styles.stepNum}>{sIdx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* TAB 2: Multiplication Tables */}
      {activeTab === 'tables' && (
        <div className="glass-card" style={{ padding: '32px' }}>
          <div className={styles.tableSection}>
            <div className={styles.tableTitle}>
              <Table size={20} style={{ color: 'hsl(var(--accent-primary))' }} />
              Multiplication Grid
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '20px' }}>
              {Array.from({ length: 19 }, (_, i) => i + 2).map((num) => (
                <button
                  key={num}
                  onClick={() => setTableNumber(num)}
                  className="btn"
                  style={{
                    background: tableNumber === num ? 'hsl(var(--accent-primary))' : 'hsl(var(--bg-tertiary))',
                    color: tableNumber === num ? '#0b0f17' : 'hsl(var(--text-primary))',
                    padding: '6px 12px',
                    fontSize: '0.85rem',
                    borderRadius: '6px',
                    border: '1px solid hsl(var(--border-color))'
                  }}
                >
                  Table {num}
                </button>
              ))}
            </div>

            <div className={styles.tablesGrid}>
              {tableValues.map((val) => (
                <div key={val} className={`glass-card ${styles.gridCard}`}>
                  <div className={styles.numberLabel}>{tableNumber} × {val}</div>
                  <div className={styles.numberValue}>{tableNumber * val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Squares */}
      {activeTab === 'squares' && (
        <div className="glass-card" style={{ padding: '32px' }}>
          <div className={styles.tableTitle}>
            <Star size={20} style={{ color: 'hsl(var(--accent-primary))' }} />
            Perfect Squares Table (2 - 30)
          </div>
          <div className={styles.tablesGrid}>
            {squareValues.map((val) => (
              <div key={val} className={`glass-card ${styles.gridCard}`}>
                <div className={styles.numberLabel}>{val}²</div>
                <div className={styles.numberValue}>{val * val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Cubes */}
      {activeTab === 'cubes' && (
        <div className="glass-card" style={{ padding: '32px' }}>
          <div className={styles.tableTitle}>
            <Star size={20} style={{ color: 'hsl(var(--accent-primary))' }} />
            Perfect Cubes Table (2 - 20)
          </div>
          <div className={styles.tablesGrid}>
            {cubeValues.map((val) => (
              <div key={val} className={`glass-card ${styles.gridCard}`}>
                <div className={styles.numberLabel}>{val}³</div>
                <div className={styles.numberValue}>{val * val * val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Fraction percentage */}
      {activeTab === 'fractions' && (
        <div className="glass-card" style={{ padding: '32px' }}>
          <div className={styles.tableTitle}>
            <BarChart2 size={20} style={{ color: 'hsl(var(--accent-primary))' }} />
            Fraction equivalents list
          </div>
          <div className={styles.fractionsGrid}>
            {fractionList.map((item, idx) => (
              <div key={idx} className={`glass-card ${styles.fractionCard}`}>
                <div className={styles.fractionExpr}>{item.frac}</div>
                <div className={styles.decimalExpr}>{item.dec}</div>
                <div className={styles.percentExpr}>{item.pct}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
