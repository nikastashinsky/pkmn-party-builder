import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { Doughnut } from 'react-chartjs-2';
import confetti from 'canvas-confetti';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement
);

const REGIONS = [
  { name: 'Kanto', range: [1, 151] },
  { name: 'Johto', range: [152, 251] },
  { name: 'Hoenn', range: [252, 386] },
  { name: 'Sinnoh', range: [387, 493] },
  { name: 'Unova', range: [494, 649] },
  { name: 'Kalos', range: [650, 721] },
  { name: 'Alola', range: [722, 809] },
  { name: 'Galar', range: [810, 905] },
  { name: 'Paldea', range: [906, 1025] },
];

const CHINESE_ZODIAC = [
  'Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake',
  'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'
];

const ASTRAL_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const COLORS = [
  'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Black', 'White', 'Silver', 'Gold', 'Cyan'
];

const TYPE_COLORS = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};

function App() {
  const [team, setTeam] = useState(Array(6).fill(null));
  const [pokemonDatabase, setPokemonDatabase] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('Kanto');
  const [isLoadingDatabase, setIsLoadingDatabase] = useState(false);
  const [showPartyView, setShowPartyView] = useState(false);
  const [partyPositions, setPartyPositions] = useState({});
  const [jumpingPokemon, setJumpingPokemon] = useState(null);
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [scoringTab, setScoringTab] = useState('personality');
  const [isDraggingState, setIsDraggingState] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const titleRef = useRef(null);
  const [personality, setPersonality] = useState({
    zodiac: '',
    astral: '',
    color: '',
  });
  const [narrative, setNarrative] = useState(null);
  const [stats, setStats] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const dragRef = useRef(null);
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const isTeamComplete = team.every(slot => slot !== null);

  // Load Pokemon database for selected region
  useEffect(() => {
    const loadRegionPokemon = async () => {
      setIsLoadingDatabase(true);
      const region = REGIONS.find(r => r.name === selectedRegion);
      if (!region) return;

      const pokemonList = [];
      const [start, end] = region.range;

      // Load in batches to avoid overwhelming the API
      const batchSize = 20;
      for (let i = start; i <= end && i <= 1025; i += batchSize) {
        const batch = [];
        for (let j = i; j < Math.min(i + batchSize, end + 1, 1026); j++) {
          batch.push(fetch(`https://pokeapi.co/api/v2/pokemon/${j}`).then(r => r.json()));
        }
        const results = await Promise.all(batch);
        results.forEach(data => {
          pokemonList.push({
            id: data.id,
            name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
            sprite: data.sprites.front_default,
            types: data.types.map(t => t.type.name),
            stats: {
              hp: data.stats[0].base_stat,
              attack: data.stats[1].base_stat,
              defense: data.stats[2].base_stat,
              spAttack: data.stats[3].base_stat,
              spDefense: data.stats[4].base_stat,
              speed: data.stats[5].base_stat,
            },
            totalStats: data.stats.reduce((sum, stat) => sum + stat.base_stat, 0),
          });
        });
      }

      setPokemonDatabase(pokemonList);
      setIsLoadingDatabase(false);
    };

    loadRegionPokemon();
  }, [selectedRegion]);

  // Handle window resize for responsive positioning
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize and update party positions - responsive to window size
  useEffect(() => {
    if (showPartyView && team.every(p => p !== null)) {
      const calculatePositions = () => {
        const initialPositions = {};
        const spriteWidth = 128;
        const spriteHeight = 128;
        
        // Responsive spacing based on window width
        const baseSpacing = Math.min(200, windowSize.width * 0.15);
        const spacingX = Math.max(150, baseSpacing);
        const spacingY = Math.max(150, baseSpacing);
        
        // Calculate the total grid dimensions
        const gridWidth = (3 - 1) * spacingX + spriteWidth;
        const gridHeight = (2 - 1) * spacingY + spriteHeight;
        
        // Get title element position if available
        let titleBottom = 200; // Default fallback
        if (titleRef.current) {
          const titleRect = titleRef.current.getBoundingClientRect();
          titleBottom = titleRect.bottom + 40; // 40px spacing below title
        } else {
          // Estimate: pt-20 (80px) + title height (~60px) + mb-8 (32px) + spacing
          titleBottom = 80 + 60 + 32 + 40;
        }
        
        // Center the grid horizontally
        const centerX = windowSize.width / 2;
        const startX = centerX - gridWidth / 2;
        
        // Position right below the title
        const startY = titleBottom;
        
        team.forEach((pokemon, index) => {
          if (pokemon) {
            const row = Math.floor(index / 3);
            const col = index % 3;
            initialPositions[pokemon.id] = {
              x: startX + col * spacingX,
              y: startY + row * spacingY,
            };
          }
        });
        setPartyPositions(initialPositions);
      };
      
      calculatePositions();
    }
  }, [showPartyView, team, windowSize, titleRef]);

  const handleAddPokemon = (pokemon) => {
    const emptySlotIndex = team.findIndex(slot => slot === null);
    if (emptySlotIndex !== -1) {
      setTeam(prev => {
        const newTeam = [...prev];
        newTeam[emptySlotIndex] = pokemon;
        // Auto-transition to party view when team is complete
        if (newTeam.every(slot => slot !== null) && !showPartyView) {
          setTimeout(() => {
            setShowPartyView(true);
          }, 300);
        }
        return newTeam;
      });
    }
  };

  const handleRemovePokemon = (index) => {
    setTeam(prev => {
      const newTeam = [...prev];
      newTeam[index] = null;
      return newTeam;
    });
  };

  const handleBuildParty = () => {
    if (isTeamComplete) {
      setShowPartyView(true);
    }
  };

  const handleEditParty = () => {
    setShowPartyView(false);
  };

  const handleCelebrate = () => {
    // Confetti explosion
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Make all pokemon jump
    team.forEach((pokemon, index) => {
      if (pokemon) {
        setTimeout(() => {
          setJumpingPokemon(pokemon.id);
          setTimeout(() => setJumpingPokemon(null), 600);
        }, index * 100);
      }
    });
  };

  const handlePokemonClick = (e, pokemonId) => {
    // Only trigger jump if not dragging
    if (!isDragging.current) {
      e.stopPropagation();
      setJumpingPokemon(pokemonId);
      setTimeout(() => setJumpingPokemon(null), 250);
    }
  };

  const handleMouseDown = (e, pokemonId) => {
    if (!partyPositions[pokemonId]) return;
    e.preventDefault(); // Prevent text selection and improve precision
    isDragging.current = true;
    setIsDraggingState(true);
    dragRef.current = pokemonId;
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !dragRef.current) return;
    
    const currentPosition = partyPositions[dragRef.current];
    if (!currentPosition) return;
    
    // Calculate new position with slower, more precise movement
    const newX = e.clientX - dragOffset.current.x;
    const newY = e.clientY - dragOffset.current.y;
    
    // Use requestAnimationFrame for smooth, controlled updates
    requestAnimationFrame(() => {
      if (isDragging.current && dragRef.current) {
        setPartyPositions(prev => ({
          ...prev,
          [dragRef.current]: {
            x: newX,
            y: newY,
          },
        }));
      }
    });
  }, [partyPositions]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    setIsDraggingState(false);
    dragRef.current = null;
  }, []);

  useEffect(() => {
    if (showPartyView) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [showPartyView, handleMouseMove, handleMouseUp]);

  const generateQualities = () => {
    const zodiacQualities = {
      Rat: 'clever adaptability',
      Ox: 'patient strength',
      Tiger: 'bold courage',
      Rabbit: 'gentle wisdom',
      Dragon: 'majestic power',
      Snake: 'mysterious insight',
      Horse: 'free-spirited energy',
      Goat: 'creative harmony',
      Monkey: 'playful intelligence',
      Rooster: 'precise confidence',
      Dog: 'loyal determination',
      Pig: 'generous contentment',
    };

    const astralQualities = {
      Aries: 'fiery determination',
      Taurus: 'celestial patience',
      Gemini: 'dual creativity',
      Cancer: 'nurturing intuition',
      Leo: 'radiant leadership',
      Virgo: 'meticulous perfection',
      Libra: 'balanced harmony',
      Scorpio: 'intense transformation',
      Sagittarius: 'adventurous freedom',
      Capricorn: 'ambitious discipline',
      Aquarius: 'innovative vision',
      Pisces: 'dreamy empathy',
    };

    const colorQualities = {
      Red: 'passionate intensity',
      Blue: 'calm wisdom',
      Green: 'natural growth',
      Yellow: 'bright optimism',
      Purple: 'mystical depth',
      Orange: 'vibrant enthusiasm',
      Pink: 'gentle compassion',
      Black: 'mysterious depth',
      White: 'pure clarity',
      Silver: 'refined elegance',
      Gold: 'noble excellence',
      Cyan: 'fresh innovation',
    };

    const qualities = [];
    if (personality.zodiac && zodiacQualities[personality.zodiac]) {
      qualities.push(zodiacQualities[personality.zodiac]);
    }
    if (personality.astral && astralQualities[personality.astral]) {
      qualities.push(astralQualities[personality.astral]);
    }
    if (personality.color && colorQualities[personality.color]) {
      qualities.push(colorQualities[personality.color]);
    }

    return qualities.length > 0 ? qualities.join(', ') : 'unique potential';
  };

  const generateNarrative = () => {
    if (!isTeamComplete) return null;
    
    const qualities = generateQualities();
    
    // More creative and elaborate statements
    const qualityDescriptions = {
      'clever adaptability': 'Your mind moves like water, flowing around obstacles with ingenious solutions that others might miss. You see patterns where chaos seems to reign.',
      'patient strength': 'Like a mountain that has weathered countless storms, your resolve is unshakeable. You understand that true power comes not from haste, but from unwavering commitment.',
      'bold courage': 'You charge forward where others hesitate, your heart beating with the rhythm of adventure. Fear is but a whisper you choose to ignore.',
      'gentle wisdom': 'Your knowledge flows like a gentle stream, nurturing growth in yourself and others. You see the beauty in quiet moments of understanding.',
      'majestic power': 'There is a regal quality to your presence, a natural authority that commands respect. You carry yourself with the dignity of ancient royalty.',
      'mysterious insight': 'You peer into the depths where others see only surface, uncovering truths hidden in shadow. Your intuition is a compass pointing toward hidden knowledge.',
      'free-spirited energy': 'Your soul dances to a rhythm all its own, unbound by convention. You find freedom in movement, in exploration, in the endless possibilities of the horizon.',
      'creative harmony': 'You weave together disparate threads into something beautiful, finding balance where others see conflict. Your creativity is a bridge between worlds.',
      'playful intelligence': 'Your mind is a playground of ideas, where serious concepts dance with whimsy. You solve problems with a smile, making the complex seem simple.',
      'precise confidence': 'Every action is measured, every word chosen with care. You move through the world with the certainty of a master craftsman, knowing exactly where each piece fits.',
      'loyal determination': 'Your commitment runs deep, a bond that time cannot erode. You stand by those you care for with the steadfastness of an ancient oak.',
      'generous contentment': 'You find joy in giving, in sharing the abundance of your spirit. Your happiness multiplies when shared, creating ripples of warmth around you.',
    };

    const teamNames = team.filter(p => p !== null).map(p => p.name);
    const typeAnalysis = analyzeTeamTypes();
    const statAnalysis = analyzeTeamStats();

    const qualitiesText = qualities.split(', ').map(q => qualityDescriptions[q] || q).join(' ');

    const userStatement = `Young Champion, your journey is illuminated by ${qualities}. ${qualitiesText} These qualities are not just traits—they are the very essence of your path, guiding each decision and shaping every victory.`;

    const teamSynergy = `Your assembled team tells a story of strategic brilliance. ${teamNames[0] || 'Your first companion'} stands as your foundation, ${teamNames[1] || 'your second ally'} brings ${typeAnalysis.dominant} energy, while ${teamNames[2] || 'your third partner'} and ${teamNames[3] || 'your fourth teammate'} create a ${statAnalysis.balance} dynamic. ${teamNames[4] || 'Your fifth member'} and ${teamNames[5] || 'your final addition'} complete the symphony, their ${typeAnalysis.coverage} ensuring no opponent can find an easy weakness. Together, they form more than a team—they are a testament to your vision.`;

    return {
      qualities: `The ${qualities}`,
      userStatement,
      teamSynergy,
      typeAnalysis,
      statAnalysis,
    };
  };

  const analyzeTeamTypes = () => {
    const validTeam = team.filter(p => p !== null);
    if (validTeam.length === 0) return { dominant: 'balanced', coverage: 'none', uniqueCount: 0 };
    
    const allTypes = validTeam.flatMap(p => p.types);
    const typeCounts = {};
    allTypes.forEach(type => {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    const dominant = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'balanced';
    const uniqueCount = new Set(allTypes).size;
    const coverage = uniqueCount >= 8 ? 'exceptional type coverage' : uniqueCount >= 5 ? 'solid type diversity' : 'focused type strategy';
    return { dominant, coverage, uniqueCount };
  };

  const analyzeTeamStats = () => {
    const validTeam = team.filter(p => p !== null);
    if (validTeam.length === 0) return { balance: 'balanced', style: 'versatile' };
    
    const avgAttack = validTeam.reduce((sum, p) => sum + p.stats.attack + p.stats.spAttack, 0) / validTeam.length;
    const avgDefense = validTeam.reduce((sum, p) => sum + p.stats.defense + p.stats.spDefense, 0) / validTeam.length;
    if (avgAttack > avgDefense * 1.2) return { balance: 'offensive', style: 'aggressive' };
    if (avgDefense > avgAttack * 1.2) return { balance: 'defensive', style: 'resilient' };
    return { balance: 'balanced', style: 'versatile' };
  };

  const getDiversityGrade = (uniqueCount) => {
    if (uniqueCount >= 10) return { grade: 'A', score: 100 };
    if (uniqueCount >= 8) return { grade: 'B', score: 85 };
    if (uniqueCount >= 6) return { grade: 'C', score: 70 };
    if (uniqueCount >= 4) return { grade: 'D', score: 55 };
    if (uniqueCount >= 2) return { grade: 'E', score: 40 };
    return { grade: 'F', score: 25 };
  };

  const calculateStats = () => {
    const validTeam = team.filter(p => p !== null);
    if (validTeam.length === 0) return null;
    
    const totalBaseStats = validTeam.reduce((sum, p) => sum + p.totalStats, 0);
    const averageTotalStats = totalBaseStats / validTeam.length;
    const rps = (averageTotalStats / 600) * 100;

    const allTypes = validTeam.flatMap(p => p.types);
    const uniqueTypes = new Set(allTypes);
    const diversityData = getDiversityGrade(uniqueTypes.size);
    const ds = diversityData.score; // Use letter grade score instead of strict percentage

    const overallScore = (rps * 0.75) + (ds * 0.25); // Adjusted weights: 75% RPS, 25% DS

    const avgStats = {
      hp: validTeam.reduce((sum, p) => sum + p.stats.hp, 0) / validTeam.length,
      attack: validTeam.reduce((sum, p) => sum + p.stats.attack, 0) / validTeam.length,
      defense: validTeam.reduce((sum, p) => sum + p.stats.defense, 0) / validTeam.length,
      spAttack: validTeam.reduce((sum, p) => sum + p.stats.spAttack, 0) / validTeam.length,
      spDefense: validTeam.reduce((sum, p) => sum + p.stats.spDefense, 0) / validTeam.length,
      speed: validTeam.reduce((sum, p) => sum + p.stats.speed, 0) / validTeam.length,
    };

    const typeDistribution = {};
    allTypes.forEach(type => {
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    return {
      rps: rps.toFixed(1),
      ds: ds.toFixed(1),
      diversityGrade: diversityData.grade,
      overallScore: overallScore.toFixed(1),
      avgStats,
      typeDistribution,
      uniqueTypesCount: uniqueTypes.size,
    };
  };

  const handleGenerateLegend = () => {
    if (!personality.zodiac || !personality.astral || !personality.color) {
      alert('Please fill in all personality fields');
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      const narrativeData = generateNarrative();
      const statsData = calculateStats();
      if (narrativeData && statsData) {
        setNarrative(narrativeData);
        setStats(statsData);
        // Stay on personality tab to view the generated content
      }
      setIsGenerating(false);
    }, 1500);
  };

  const handleOpenScoring = () => {
    // Always open modal - personality is first step
    setShowScoringModal(true);
    setScoringTab('personality');
  };

  const getScoreColor = (score) => {
    if (score < 40) return 'text-red-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getScoreBgColor = (score) => {
    if (score < 40) return 'bg-red-100 border-red-300';
    if (score < 70) return 'bg-yellow-100 border-yellow-300';
    return 'bg-green-100 border-green-300';
  };

  const getScoreMessage = (score) => {
    if (score < 40) {
      return {
        title: 'Rookie Team',
        message: 'Your team shows promise, but statistical power is currently below competitive standards. The type coverage is thin, leaving significant vulnerabilities that opponents could exploit. Consider diversifying your type selection and incorporating Pokémon with higher base stat totals to create a more formidable foundation. Every champion starts somewhere, and with strategic adjustments, your team can evolve into something truly remarkable.',
        suggestions: [
          'Focus on adding Pokémon with base stat totals above 500',
          'Aim for at least 6-8 different types across your team',
          'Balance offensive and defensive capabilities',
          'Consider legendary or pseudo-legendary Pokémon for power boosts'
        ]
      };
    } else if (score < 70) {
      return {
        title: 'Solid Team',
        message: 'You\'ve built a respectable foundation that demonstrates solid understanding of team composition. Your statistical averages are balanced, and type diversity shows thoughtful consideration. However, there\'s room to push beyond good into greatness. Adding a bit more statistical muscle or expanding type variety could elevate your team from solid to exceptional. The framework is there—now it\'s time to refine and perfect.',
        suggestions: [
          'Consider replacing lower-stat Pokémon with higher-tier options',
          'Expand type coverage to 8+ unique types',
          'Optimize stat distribution for your battle strategy',
          'Experiment with different type combinations for better synergy'
        ]
      };
    } else {
      return {
        title: 'Elite Team',
        message: 'Congratulations! You\'ve assembled a team worthy of the highest competitive arenas. Your statistical prowess is exceptional, and your type diversity creates a nearly impenetrable defensive and offensive matrix. This team demonstrates master-level understanding of Pokémon synergy, stat optimization, and strategic coverage. You\'ve created something that can stand toe-to-toe with the best trainers in the world. The path to victory is clear—now go claim your glory!',
        suggestions: [
          'Your team is ready for competitive play',
          'Consider fine-tuning move sets for maximum synergy',
          'Experiment with different battle strategies',
          'Share your team composition with others to inspire'
        ]
      };
    }
  };

  const radarData = stats ? {
    labels: ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'],
    datasets: [{
      label: 'Average Stats',
      data: [
        stats.avgStats.hp,
        stats.avgStats.attack,
        stats.avgStats.defense,
        stats.avgStats.spAttack,
        stats.avgStats.spDefense,
        stats.avgStats.speed,
      ],
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(59, 130, 246, 1)',
    }],
  } : null;

  const donutData = stats ? {
    labels: Object.keys(stats.typeDistribution),
    datasets: [{
      data: Object.values(stats.typeDistribution),
      backgroundColor: Object.keys(stats.typeDistribution).map(type => 
        TYPE_COLORS[type] || '#A8A878'
      ),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  } : null;

  // Party View
  if (showPartyView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 relative overflow-hidden animate-fade-in">
        <button
          onClick={handleEditParty}
          className="absolute top-4 left-4 px-4 py-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors z-10"
        >
          ← Edit Party
        </button>

        <div className="container mx-auto pt-20 pb-32">
          <h1 
            ref={titleRef}
            className="text-4xl font-bold text-center text-gray-800 mb-8"
          >
            Your Pokémon Party
          </h1>

          <div className="relative" style={{ minHeight: '60vh' }}>
            {team.map((pokemon, index) => {
              if (!pokemon) return null;
              const position = partyPositions[pokemon.id] || { x: 0, y: 0 };
              const isJumping = jumpingPokemon === pokemon.id;

              return (
                <div
                  key={pokemon.id}
                  className={`absolute cursor-move animate-fade-in ${
                    isJumping ? 'animate-bounce' : ''
                  }`}
                  style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    transform: isJumping ? 'translateY(-3px)' : 'none',
                    animationDelay: `${index * 0.1}s`,
                    pointerEvents: 'auto',
                    transition: isDraggingState && dragRef.current === pokemon.id ? 'none' : 'left 0.3s ease-out, top 0.3s ease-out, transform 0.2s ease-out',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, pokemon.id)}
                  onClick={(e) => handlePokemonClick(e, pokemon.id)}
                >
                  <div 
                    className="golden-glow"
                    style={{
                      filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 25px rgba(255, 215, 0, 0.6))',
                      padding: '8px',
                    }}
                  >
                    <img
                      src={pokemon.sprite}
                      alt={pokemon.name}
                      draggable={false}
                      style={{ 
                        imageRendering: 'pixelated',
                        width: '128px',
                        height: '128px',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-10">
            <button
              onClick={handleCelebrate}
              className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all font-bold text-lg shadow-lg transform hover:scale-105"
            >
              🎉 Celebrate!
            </button>
            <button
              onClick={handleOpenScoring}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all font-bold text-lg shadow-lg transform hover:scale-105"
            >
              Assess My Party!
            </button>
          </div>
        </div>

        {/* Scoring Modal */}
        {showScoringModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">Team Analysis</h2>
                <button
                  onClick={() => setShowScoringModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="flex border-b">
                <button
                  onClick={() => setScoringTab('personality')}
                  className={`flex-1 px-4 py-3 font-semibold ${
                    scoringTab === 'personality'
                      ? 'bg-purple-100 text-purple-700 border-b-2 border-purple-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Personality
                </button>
                <button
                  onClick={() => setScoringTab('stats')}
                  className={`flex-1 px-4 py-3 font-semibold ${
                    scoringTab === 'stats'
                      ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Statistics
                </button>
                <button
                  onClick={() => setScoringTab('assessment')}
                  className={`flex-1 px-4 py-3 font-semibold ${
                    scoringTab === 'assessment'
                      ? 'bg-green-100 text-green-700 border-b-2 border-green-500'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Final Assessment
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {scoringTab === 'personality' && (
                  <div className="space-y-6">
                    {!narrative ? (
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                          Personality Assessment
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Chinese Zodiac
                            </label>
                            <select
                              value={personality.zodiac}
                              onChange={(e) =>
                                setPersonality({ ...personality, zodiac: e.target.value })
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Zodiac...</option>
                              {CHINESE_ZODIAC.map((zodiac) => (
                                <option key={zodiac} value={zodiac}>
                                  {zodiac}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Astral Sign
                            </label>
                            <select
                              value={personality.astral}
                              onChange={(e) =>
                                setPersonality({ ...personality, astral: e.target.value })
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Astral Sign...</option>
                              {ASTRAL_SIGNS.map((sign) => (
                                <option key={sign} value={sign}>
                                  {sign}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Favorite Color
                            </label>
                            <select
                              value={personality.color}
                              onChange={(e) =>
                                setPersonality({ ...personality, color: e.target.value })
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Color...</option>
                              {COLORS.map((color) => (
                                <option key={color} value={color}>
                                  {color}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <button
                          onClick={handleGenerateLegend}
                          disabled={isGenerating || !personality.zodiac || !personality.astral || !personality.color}
                          className="w-full px-6 py-2.5 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-purple-300 transition-colors font-semibold"
                        >
                          {isGenerating ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="animate-spin-fast w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                              Generating...
                            </span>
                          ) : (
                            'Generate Personal Legend'
                          )}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                          <h3 className="text-xl font-bold text-gray-800 mb-4">
                            Champions Spirit
                          </h3>
                          <p className="text-lg text-gray-700 mb-4">
                            {narrative.qualities}
                          </p>
                          <p className="text-lg italic text-gray-800">
                            {narrative.userStatement}
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-6 border border-blue-200">
                          <h3 className="text-xl font-bold text-gray-800 mb-4">
                            Team Synergy Analysis
                          </h3>
                          <p className="text-lg text-gray-700">
                            {narrative.teamSynergy}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {scoringTab === 'stats' && stats && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-4 text-center">
                          Raw Power Score (RPS)
                        </h3>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-blue-600 mb-2">
                            {stats.rps}%
                          </div>
                          <p className="text-sm text-gray-600">
                            Average Total Base Stats: {(parseFloat(stats.rps) / 100 * 600).toFixed(1)} / 600
                          </p>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-4 text-center">
                          Type Diversity Score (DS)
                        </h3>
                        <div className="text-center">
                          <div className="text-4xl font-bold text-green-600 mb-2">
                            {stats.diversityGrade}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            Score: {stats.ds}%
                          </p>
                          <p className="text-sm text-gray-600">
                            Unique Types: {stats.uniqueTypesCount} / 12
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h3 className="font-semibold text-lg mb-4 text-center">
                          Average Stats (Radar Chart)
                        </h3>
                        {radarData && (
                          <Radar
                            data={radarData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: true,
                              scales: {
                                r: {
                                  beginAtZero: true,
                                  max: 150,
                                },
                              },
                            }}
                          />
                        )}
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h3 className="font-semibold text-lg mb-4 text-center">
                          Type Distribution (Donut Chart)
                        </h3>
                        {donutData && (
                          <Doughnut
                            data={donutData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: true,
                              plugins: {
                                legend: {
                                  position: 'bottom',
                                },
                              },
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {scoringTab === 'assessment' && stats && (
                  <div className="space-y-6">
                    <div
                      className={`rounded-lg p-8 border-4 text-center ${getScoreBgColor(
                        parseFloat(stats.overallScore)
                      )}`}
                    >
                      <div
                        className={`text-6xl font-bold mb-4 ${getScoreColor(
                          parseFloat(stats.overallScore)
                        )}`}
                      >
                        {stats.overallScore}%
                      </div>
                      <p
                        className={`text-2xl font-semibold mb-4 ${getScoreColor(
                          parseFloat(stats.overallScore)
                        )}`}
                      >
                        {getScoreMessage(parseFloat(stats.overallScore)).title}
                      </p>
                      <p className="text-lg text-gray-800 mb-6">
                        {getScoreMessage(parseFloat(stats.overallScore)).message}
                      </p>
                      <div className="mt-6 grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
                        <div className="bg-white rounded p-3">
                          <div className="text-sm text-gray-600">RPS</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {stats.rps}%
                          </div>
                        </div>
                        <div className="bg-white rounded p-3">
                          <div className="text-sm text-gray-600">DS</div>
                          <div className="text-2xl font-bold text-green-600">
                            {stats.ds}%
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 mt-6 text-left">
                        <h4 className="font-semibold text-gray-800 mb-2">Suggestions for Improvement:</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {getScoreMessage(parseFloat(stats.overallScore)).suggestions.map((suggestion, i) => (
                            <li key={i}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main Builder View
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">
          Pokémon Team Builder & Assessor
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Build your dream team and discover your personalized legend
        </p>

        {/* Roster Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {team.map((pokemon, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-lg shadow-md p-4 border-2 transition-all duration-300 ${
                pokemon ? 'border-blue-300' : 'border-gray-200 border-dashed'
              }`}
            >
              {pokemon ? (
                <>
                  <button
                    onClick={() => handleRemovePokemon(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                  <div className="flex flex-col items-center">
                    <img
                      src={pokemon.sprite}
                      alt={pokemon.name}
                      className="w-20 h-20 mb-2"
                    />
                    <h3 className="font-semibold text-sm text-gray-800 mb-1">
                      {pokemon.name}
                    </h3>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {pokemon.types.map((type, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs rounded-full text-white"
                          style={{ backgroundColor: TYPE_COLORS[type] || '#A8A878' }}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-gray-600">
                      #{pokemon.id} • {pokemon.totalStats}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-400">
                  <svg
                    className="w-12 h-12 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span className="text-sm">Empty Slot</span>
                </div>
              )}
            </div>
          ))}
        </div>


        {/* Pokemon Database */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Pokémon Database
          </h2>

          {/* Region Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
            {REGIONS.map((region) => (
              <button
                key={region.name}
                onClick={() => setSelectedRegion(region.name)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  selectedRegion === region.name
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {region.name}
              </button>
            ))}
          </div>

          {/* Pokemon Grid */}
          {isLoadingDatabase ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin-fast w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 max-h-96 overflow-y-auto">
              {pokemonDatabase.map((pokemon) => (
                <button
                  key={pokemon.id}
                  onClick={() => handleAddPokemon(pokemon)}
                  disabled={isTeamComplete}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                    isTeamComplete
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-blue-50 hover:shadow-md cursor-pointer'
                  }`}
                >
                  <img
                    src={pokemon.sprite}
                    alt={pokemon.name}
                    className="w-16 h-16 mb-1"
                  />
                  <div className="text-xs font-semibold text-gray-800 text-center">
                    {pokemon.name}
                  </div>
                  <div className="text-xs text-gray-500">#{pokemon.id}</div>
                  <div className="flex gap-1 mt-1">
                    {pokemon.types.map((type, i) => (
                      <span
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: TYPE_COLORS[type] || '#A8A878' }}
                        title={type}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Build Party Button */}
        {isTeamComplete && (
          <div className="text-center">
            <button
              onClick={handleBuildParty}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all font-bold text-lg shadow-lg transform hover:scale-105"
            >
              Build My Party!
            </button>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out;
        }
        @keyframes spin-fast {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-fast {
          animation: spin-fast 0.5s linear infinite;
        }
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        .animate-bounce {
          animation: bounce 0.2s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default App;
