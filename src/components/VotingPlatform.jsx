import React, { useState, useRef, useEffect } from 'react';

import { Camera, CheckCircle, XCircle, Users, Clock, Award, AlertCircle, Shield, ShieldCheck, Edit2, Play, Calendar } from 'lucide-react';

import { createWorker } from 'tesseract.js';

const VotingPlatform = () => {

  const [stage, setStage] = useState('scan');

  const [stream, setStream] = useState(null);

  const [capturedImage, setCapturedImage] = useState(null);

  const [verifying, setVerifying] = useState(false);

  const [cardData, setCardData] = useState(null);

  const [verificationError, setVerificationError] = useState('');

  const [timeRemaining, setTimeRemaining] = useState(60);

  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [userRole, setUserRole] = useState(null); // 'admin' ou 'superadmin'

  const [adminPassword, setAdminPassword] = useState('');

  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const [loginType, setLoginType] = useState(null); // 'admin' ou 'superadmin'

  const [electionStatus, setElectionStatus] = useState('not_started'); // 'not_started', 'active', 'results_available'

  const [electionStartTime, setElectionStartTime] = useState(null);

  const [timeUntilResults, setTimeUntilResults] = useState(null);

  const [editingVotes, setEditingVotes] = useState(false);

  const [tempVotes, setTempVotes] = useState({});

  const [showElectionConfig, setShowElectionConfig] = useState(false);

  const [numberOfParties, setNumberOfParties] = useState(4);

  const [partyNames, setPartyNames] = useState(['', '', '', '']);

  const [candidates, setCandidates] = useState([]);

  

  const videoRef = useRef(null);

  const canvasRef = useRef(null);

  const timerRef = useRef(null);

  const electionTimerRef = useRef(null);

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const ADMIN_PASSWORD = 'admin';

  const SUPER_ADMIN_PASSWORD = 'Presi25';

  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500'];

  const [votes, setVotes] = useState({});

  const [votedStudents, setVotedStudents] = useState(new Set());

  useEffect(() => {

    const initialize = async () => {

      await loadElectionConfig();

      await loadVotingData();

      loadElectionStatus();

      checkElectionTimer();

    };

    initialize();

    

    return () => {

      if (stream) {

        stream.getTracks().forEach(track => track.stop());

      }

      if (timerRef.current) {

        clearInterval(timerRef.current);

      }

      if (electionTimerRef.current) {

        clearInterval(electionTimerRef.current);

      }

    };

  }, []);


  useEffect(() => {

    if (electionStatus === 'active' && electionStartTime) {

      startElectionTimer();

    }

  }, [electionStatus, electionStartTime]);

  const loadElectionConfig = async () => {

    try {

      const configResult = await window.storage.get('election_config', true);

      

      if (configResult) {

        const config = JSON.parse(configResult.value);

        setCandidates(config.candidates || []);

        setNumberOfParties(config.numberOfParties || 4);

        setPartyNames(config.partyNames || []);

      } else {

        // Configuration par défaut si aucune configuration n'existe

        const defaultCandidates = [];

        setCandidates(defaultCandidates);

      }

    } catch (error) {

      console.error('Erreur lors du chargement de la configuration:', error);

      setCandidates([]);

    }

  };

  const loadVotingData = async () => {

    try {

      const votesResult = await window.storage.get('election_votes', true);

      const studentsResult = await window.storage.get('voted_students', true);

      

      // Charger les candidats depuis la config si nécessaire

      let currentCandidates = candidates;

      if (currentCandidates.length === 0) {

        const configResult = await window.storage.get('election_config', true);

        if (configResult) {

          const config = JSON.parse(configResult.value);

          currentCandidates = config.candidates || [];

        }

      }

      

      if (votesResult && currentCandidates.length > 0) {

        const savedVotes = JSON.parse(votesResult.value);

        // S'assurer que tous les candidats ont des votes

        const initialVotes = {};

        currentCandidates.forEach(c => {

          initialVotes[c.id] = savedVotes[c.id] || 0;

        });

        setVotes(initialVotes);

        setTempVotes(initialVotes);

      } else if (currentCandidates.length > 0) {

        const initialVotes = {};

        currentCandidates.forEach(c => initialVotes[c.id] = 0);

        setVotes(initialVotes);

        setTempVotes(initialVotes);

      }

      

      if (studentsResult) {

        setVotedStudents(new Set(JSON.parse(studentsResult.value)));

      }

    } catch (error) {

      console.error('Erreur lors du chargement des votes:', error);

      if (candidates.length > 0) {

        const initialVotes = {};

        candidates.forEach(c => initialVotes[c.id] = 0);

        setVotes(initialVotes);

        setTempVotes(initialVotes);

      }

      setVotedStudents(new Set());

    }

  };

  const loadElectionStatus = async () => {

    try {

      const statusResult = await window.storage.get('election_status', true);

      const startTimeResult = await window.storage.get('election_start_time', true);

      

      if (statusResult) {

        setElectionStatus(statusResult.value);

      }

      

      if (startTimeResult) {

        const startTime = parseInt(startTimeResult.value);

        setElectionStartTime(startTime);

        const now = Date.now();

        const elapsed = now - startTime;

        const thirtyMinutes = 30 * 60 * 1000;

        

        if (elapsed >= thirtyMinutes) {

          setElectionStatus('results_available');

          setTimeUntilResults(0);

        } else {

          setTimeUntilResults(thirtyMinutes - elapsed);

        }

      }

    } catch (error) {

      console.error('Erreur lors du chargement du statut:', error);

    }

  };

  const checkElectionTimer = () => {

    if (electionStatus === 'active' && electionStartTime) {

      startElectionTimer();

    }

  };

  const startElectionTimer = () => {

    if (electionTimerRef.current) {

      clearInterval(electionTimerRef.current);

    }

    

    electionTimerRef.current = setInterval(() => {

      if (electionStartTime) {

        const now = Date.now();

        const elapsed = now - electionStartTime;

        const thirtyMinutes = 30 * 60 * 1000;

        

        if (elapsed >= thirtyMinutes) {

          setElectionStatus('results_available');

          setTimeUntilResults(0);

          clearInterval(electionTimerRef.current);

          window.storage.set('election_status', 'results_available', true);

          

          // Si l'admin est connecté, afficher automatiquement les résultats

          if (userRole === 'admin' && stage === 'admin_dashboard') {

            setStage('results');

          }

        } else {

          setTimeUntilResults(thirtyMinutes - elapsed);

        }

      }

    }, 1000);

  };

  const handlePartyCountChange = (count) => {

    const num = parseInt(count) || 2;

    if (num < 2) {

      setNumberOfParties(2);

      setPartyNames(['', '']);

    } else if (num > 8) {

      setNumberOfParties(8);

      setPartyNames([...partyNames.slice(0, 8), ...Array(8 - partyNames.length).fill('')]);

    } else {

      setNumberOfParties(num);

      const newPartyNames = [...partyNames];

      if (num > partyNames.length) {

        newPartyNames.push(...Array(num - partyNames.length).fill(''));

      } else {

        newPartyNames.splice(num);

      }

      setPartyNames(newPartyNames);

    }

  };

  const handlePartyNameChange = (index, name) => {

    const newPartyNames = [...partyNames];

    newPartyNames[index] = name;

    setPartyNames(newPartyNames);

  };

  const saveElectionConfig = async () => {

    // Vérifier que tous les noms sont remplis

    if (partyNames.some(name => !name.trim())) {

      alert('Veuillez remplir tous les noms de partis');

      return;

    }

    

    // Créer les candidats à partir des noms de partis

    const newCandidates = partyNames.map((partyName, index) => ({

      id: index + 1,

      name: partyName.trim(),

      party: partyName.trim(),

      color: colors[index % colors.length]

    }));

    

    setCandidates(newCandidates);

    

    // Sauvegarder la configuration

    const config = {

      numberOfParties,

      partyNames: partyNames.map(name => name.trim()),

      candidates: newCandidates

    };

    

    await window.storage.set('election_config', JSON.stringify(config), true);

    

    // Initialiser les votes à zéro pour chaque candidat

    const initialVotes = {};

    newCandidates.forEach(c => initialVotes[c.id] = 0);

    setVotes(initialVotes);

    setTempVotes(initialVotes);

    await window.storage.set('election_votes', JSON.stringify(initialVotes), true);

    

    setShowElectionConfig(false);

  };

  const startElection = async () => {

    if (candidates.length === 0) {

      alert('Veuillez d\'abord configurer l\'élection');

      setShowElectionConfig(true);

      return;

    }

    

    const startTime = Date.now();

    setElectionStartTime(startTime);

    setElectionStatus('active');

    await window.storage.set('election_status', 'active', true);

    await window.storage.set('election_start_time', startTime.toString(), true);

    startElectionTimer();

    setStage('scan');

  };

  const startCamera = async () => {

    try {

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {

        console.warn('getUserMedia non disponible');

        return;

      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ 

        video: { 

          facingMode: { ideal: 'environment' },

          width: { ideal: 1280 },

          height: { ideal: 720 }

        } 

      });

      setStream(mediaStream);

      if (videoRef.current) {

        videoRef.current.srcObject = mediaStream;

        await videoRef.current.play();

      }

    } catch (error) {

      console.error('Erreur caméra:', error);

      alert('Impossible d\'accéder à la caméra. Vous pouvez importer une photo.');

    }

  };

  const capturePhoto = () => {

    const video = videoRef.current;

    const canvas = canvasRef.current;

    

    if (video && canvas) {

      const ctx = canvas.getContext('2d');

      canvas.width = video.videoWidth;

      canvas.height = video.videoHeight;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL('image/jpeg');

      setCapturedImage(imageData);

      

      if (stream) {

        stream.getTracks().forEach(track => track.stop());

        setStream(null);

      }

    }

  };

  const handleFileUpload = (e) => {

    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {

      setCapturedImage(event.target.result);

    };

    reader.readAsDataURL(file);

  };

  // Fonction pour parser le texte extrait et trouver les informations
  const parseCardText = (text) => {

    const cardInfo = {

      isStudentCard: false,

      lastName: '',

      firstName: '',

      validityDate: '',

      validUntil: '',

      at: '',

      isValid: false,

      studentId: '',

      country: '',

      isTanguieta: false

    };

    // Vérifier si c'est une carte étudiante (chercher des mots-clés)

    const studentCardKeywords = ['carte', 'etudiant', 'student', 'matricule', 'validite', 'validity'];

    const lowerText = text.toLowerCase();

    const hasStudentCardKeyword = studentCardKeywords.some(keyword => lowerText.includes(keyword));

    if (!hasStudentCardKeyword) {

      return cardInfo;

    }

    cardInfo.isStudentCard = true;

    // Extraire le nom et prénom
    // Format typique: "MALICK Abdul-rafick" ou "MALICK" sur une ligne et "Abdul-rafick" sur la suivante
    // Le nom est situé en bas de la carte étudiante
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Chercher dans les dernières lignes (le nom est en bas de la carte)
    // Commencer par la fin et remonter
    const startIndex = Math.max(0, lines.length - 20); // Chercher dans les 20 dernières lignes
    
    for (let i = lines.length - 1; i >= startIndex; i--) {

      const line = lines[i];

      // Pattern 1: Nom en majuscules suivi de prénom sur la même ligne (ex: "MALICK Abdul-rafick")
      // Le nom peut être en majuscules complètes, le prénom commence par une majuscule puis minuscules (peut contenir des tirets)
      // Pattern amélioré pour détecter "MALICK Abdul-rafick" avec tiret et minuscules après le tiret
      const pattern1 = /^([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß]{2,})\s+([A-Z][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+(?:-[a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+)*(?:\s+[A-Z][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ-]+)*)/;

      const match1 = line.match(pattern1);

      if (match1) {

        cardInfo.lastName = match1[1].trim();

        cardInfo.firstName = match1[2].trim();

        console.log('Nom trouvé (pattern 1):', cardInfo.lastName, cardInfo.firstName);

        break;

      }

      // Pattern 2: Ligne avec seulement des majuscules (nom de famille comme "MALICK")
      // La ligne suivante pourrait être le prénom (comme "Abdul-rafick")
      const allUpperCasePattern = /^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß\s]{2,}$/;

      if (allUpperCasePattern.test(line) && line.length >= 2 && line.length < 50 && !line.includes(':')) {

        // Vérifier si la ligne précédente (plus haut dans le texte) contient un prénom
        // Comme on parcourt depuis la fin, la ligne précédente (i-1) est plus bas dans la carte
        if (i > 0) {

          const prevLine = lines[i - 1].trim();

          // Pattern pour prénom: commence par majuscule, puis minuscules, peut contenir des tirets suivis de minuscules
          // Ex: "Abdul-rafick" ou "Jean-Pierre"
          const firstNamePattern = /^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+(?:-[a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+)*(?:\s+[A-Z][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ-]+)*$/;

          if (firstNamePattern.test(prevLine) && prevLine.length >= 2 && prevLine.length < 50 && !prevLine.includes(':')) {

            // Si on trouve un prénom sur la ligne précédente, c'est probablement: prénom puis nom
            cardInfo.firstName = prevLine.trim();

            cardInfo.lastName = line.trim();

            console.log('Nom trouvé (pattern 2 - prénom avant nom):', cardInfo.lastName, cardInfo.firstName);

            break;

          }

        }

        // Aussi vérifier la ligne suivante (plus bas dans le texte, donc i+1)
        // Comme on parcourt depuis la fin, la ligne suivante (i+1) est plus haut dans la carte
        if (i + 1 < lines.length) {

          const nextLine = lines[i + 1].trim();

          const firstNamePattern = /^[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+(?:-[a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+)*(?:\s+[A-Z][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ-]+)*$/;

          if (firstNamePattern.test(nextLine) && nextLine.length >= 2 && nextLine.length < 50 && !nextLine.includes(':')) {

            // Si on trouve un prénom sur la ligne suivante, c'est probablement: nom puis prénom
            cardInfo.lastName = line.trim();

            cardInfo.firstName = nextLine.trim();

            console.log('Nom trouvé (pattern 2 - nom avant prénom):', cardInfo.lastName, cardInfo.firstName);

            break;

          }

        }

      }

      // Pattern 3: Chercher directement "MALICK" suivi de "Abdul-rafick" même avec des espaces/tirets
      // Format: "MALICK" puis "Abdul-rafick" ou "Abdul-Rafick"
      // Pattern amélioré pour mieux détecter les prénoms avec tirets et minuscules
      const combinedPattern = /([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß]{2,})\s+([A-Z][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+(?:-[a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+)*)/;

      const combinedMatch = line.match(combinedPattern);

      if (combinedMatch && !cardInfo.lastName) {

        const potentialLastName = combinedMatch[1].trim();

        const potentialFirstName = combinedMatch[2].trim();

        // Vérifier que le premier groupe est bien en majuscules et le second commence par majuscule

        if (potentialLastName === potentialLastName.toUpperCase() && 

            potentialFirstName[0] === potentialFirstName[0].toUpperCase() &&

            potentialFirstName.length > 2) {

          cardInfo.lastName = potentialLastName;

          cardInfo.firstName = potentialFirstName;

          console.log('Nom trouvé (pattern 3):', cardInfo.lastName, cardInfo.firstName);

          break;

        }

      }

    }

    // Extraire le lieu (At)
    // Chercher "At:" ou "A At:" suivi du lieu
    const atPattern = /(?:A\s+)?At:\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\s-]+)/i;

    const atMatch = text.match(atPattern);

    if (atMatch) {

      cardInfo.at = atMatch[1].trim();

      // Vérifier si c'est Tanguiéta

      const tanguietaVariations = ['tanguieta', 'tanguiéta', 'tanguieta', 'tanguietta'];

      const atLower = cardInfo.at.toLowerCase();

      cardInfo.isTanguieta = tanguietaVariations.some(variation => atLower.includes(variation));

    }

    // Extraire la date de validité
    // Format: "02/11 2023 au 02/11/2028" ou "02/11/2028"
    const datePattern = /(\d{2}\/\d{2}(?:\s+\d{4})?(?:\s+au\s+)?\d{2}\/\d{2}\/\d{4})/;

    const dateMatch = text.match(datePattern);

    if (dateMatch) {

      cardInfo.validityDate = dateMatch[1].trim();

      // Extraire la date de fin

      const endDatePattern = /(\d{2}\/\d{2}\/\d{4})/g;

      const dates = text.match(endDatePattern);

      if (dates && dates.length > 0) {

        // Prendre la dernière date trouvée (généralement la date de fin)

        cardInfo.validUntil = dates[dates.length - 1];

      }

    }

    // Extraire le matricule/ID étudiant
    const matriculePattern = /(?:Matricule|ID|matricule)[:\s]*(\d+)/i;

    const matriculeMatch = text.match(matriculePattern);

    if (matriculeMatch) {

      cardInfo.studentId = matriculeMatch[1].trim();

    }

    // Extraire le pays
    const countryPattern = /(?:Pays|Country|pays)[:\s]*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞß][a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ\s]+)/i;

    const countryMatch = text.match(countryPattern);

    if (countryMatch) {

      cardInfo.country = countryMatch[1].trim().split('\n')[0].trim();

    }

    // Vérifier si la carte est valide
    if (cardInfo.validUntil) {

      const [day, month, year] = cardInfo.validUntil.split('/').map(Number);

      const expiryDate = new Date(year, month - 1, day);

      const currentDate = new Date();

      cardInfo.isValid = expiryDate > currentDate;

    } else {

      // Si pas de date trouvée, considérer comme valide par défaut

      cardInfo.isValid = true;

    }

    return cardInfo;

  };

  const verifyCard = async () => {

    setVerifying(true);

    setVerificationError('');

    

    try {

      if (!capturedImage) {

        setVerificationError('Aucune image capturée.');

        setVerifying(false);

        return;

      }

      // Utiliser Tesseract.js pour extraire le texte de l'image

      const worker = await createWorker('fra+eng'); // Français et Anglais

      const { data: { text } } = await worker.recognize(capturedImage);

      await worker.terminate();

      console.log('Texte extrait par OCR:', text);

      // Parser le texte pour extraire les informations

      const cardInfo = parseCardText(text);

      console.log('Informations extraites:', cardInfo);

      

      if (!cardInfo.isStudentCard) {

        setVerificationError('Ce n\'est pas une carte étudiante valide.');

        setVerifying(false);

        return;

      }

      // Vérifier que les champs requis sont présents

      if (!cardInfo.lastName || !cardInfo.firstName) {

        setVerificationError('Impossible d\'extraire le nom et/ou le prénom de la carte. Veuillez réessayer avec une photo plus claire.');

        setVerifying(false);

        return;

      }

      if (!cardInfo.at) {

        setVerificationError('Impossible d\'extraire le lieu (At) de la carte. Veuillez réessayer avec une photo plus claire.');

        setVerifying(false);

        return;

      }

      if (!cardInfo.validUntil && !cardInfo.validityDate) {

        setVerificationError('Impossible d\'extraire la date de validité de la carte. Veuillez réessayer avec une photo plus claire.');

        setVerifying(false);

        return;

      }

      

      if (!cardInfo.isValid) {

        setVerificationError('Carte expirée. Date de validité: ' + (cardInfo.validityDate || cardInfo.validUntil));

        setVerifying(false);

        return;

      }

      

      if (!cardInfo.isTanguieta) {

        setVerificationError('Cette élection est réservée aux étudiants de Tanguiéta. Lieu détecté: ' + (cardInfo.at || 'Non spécifié'));

        setVerifying(false);

        return;

      }

      

      // Créer un identifiant unique pour l'étudiant

      const studentIdentifier = (cardInfo.lastName + '_' + cardInfo.firstName + '_' + (cardInfo.studentId || '')).toLowerCase().replace(/\s+/g, '_');

      

      if (votedStudents.has(studentIdentifier)) {

        setVerificationError('Cet étudiant a déjà voté !');

        setVerifying(false);

        setTimeout(() => {

          setCapturedImage(null);

          setVerificationError('');

        }, 3000);

        return;

      }

      

      if (electionStatus !== 'active') {

        setVerificationError('Les élections ne sont pas encore ouvertes.');

        setVerifying(false);

        return;

      }

      

      // Stocker toutes les informations extraites

      setCardData({ 

        ...cardInfo, 

        identifier: studentIdentifier,

        name: `${cardInfo.firstName} ${cardInfo.lastName}`, // Nom complet pour l'affichage

        city: cardInfo.at // Pour compatibilité avec l'affichage existant

      });

      setVerifying(false);

      setStage('voting');

      startVotingTimer();

      

    } catch (error) {

      console.error('Erreur de vérification:', error);

      if (error.message?.includes('worker') || error.message?.includes('tesseract')) {

        setVerificationError('Erreur lors de l\'extraction du texte. Veuillez réessayer avec une photo plus claire et bien éclairée.');

      } else {

        setVerificationError('Erreur lors de la vérification: ' + (error.message || 'Erreur inconnue'));

      }

      setVerifying(false);

    }

  };

  const startVotingTimer = () => {

    setTimeRemaining(60);

    timerRef.current = setInterval(() => {

      setTimeRemaining(prev => {

        if (prev <= 1) {

          clearInterval(timerRef.current);

          setStage('results');

          return 0;

        }

        return prev - 1;

      });

    }, 1000);

  };

  const submitVote = async () => {

    if (!selectedCandidate || !cardData) return;

    

    clearInterval(timerRef.current);

    

    const newVotes = { ...votes };

    newVotes[selectedCandidate] = (newVotes[selectedCandidate] || 0) + 1;

    

    const newVotedStudents = new Set(votedStudents);

    newVotedStudents.add(cardData.identifier);

    

    try {

      await window.storage.set('election_votes', JSON.stringify(newVotes), true);

      await window.storage.set('voted_students', JSON.stringify([...newVotedStudents]), true);

      

      setVotes(newVotes);

      setVotedStudents(newVotedStudents);

    } catch (error) {

      console.error('Erreur lors de l\'enregistrement du vote:', error);

    }

    

    setStage('voted');

    setTimeout(() => {

      resetPlatform();

    }, 3000);

  };

  const resetPlatform = () => {

    setCapturedImage(null);

    setSelectedCandidate(null);

    setCardData(null);

    setVerificationError('');

    setTimeRemaining(60);

    setStage('scan');

    if (timerRef.current) clearInterval(timerRef.current);

  };

  const handleAdminLogin = () => {

    if (!adminPassword) {

      alert('Veuillez entrer un mot de passe');

      return;

    }

    

    let isValid = false;

    let role = null;

    

    // Détection automatique du rôle selon le mot de passe

    if (adminPassword === SUPER_ADMIN_PASSWORD) {

      isValid = true;

      role = 'superadmin';

    } else if (adminPassword === ADMIN_PASSWORD) {

      isValid = true;

      role = 'admin';

    }

    

    if (isValid) {

      setUserRole(role);

      setShowAdminLogin(false);

      setAdminPassword('');

      setLoginType(null);

      

      if (electionStatus === 'not_started' && role === 'admin') {

        setStage('admin_dashboard');

      } else if (role === 'superadmin') {

        setStage('results');

      } else {

        setStage('results');

      }

    } else {

      alert('Mot de passe incorrect');

    }

  };

  const canViewResults = () => {

    if (userRole === 'superadmin') return true;

    if (userRole === 'admin' && electionStatus === 'results_available') return true;

    return false;

  };

  const canModifyVotes = () => {

    return userRole === 'superadmin' && electionStatus === 'active' && timeUntilResults > 0;

  };

  const updateVote = (candidateId, newCount) => {

    const updated = { ...tempVotes };

    updated[candidateId] = Math.max(0, parseInt(newCount) || 0);

    setTempVotes(updated);

  };

  const saveVoteChanges = async () => {

    setVotes(tempVotes);

    await window.storage.set('election_votes', JSON.stringify(tempVotes), true);

    setEditingVotes(false);

  };

  const cancelVoteChanges = () => {

    setTempVotes(votes);

    setEditingVotes(false);

  };

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

  const results = candidates.map(c => ({

    ...c,

    votes: votes[c.id] || 0,

    percentage: totalVotes > 0 ? ((votes[c.id] || 0) / totalVotes * 100).toFixed(1) : 0

  })).sort((a, b) => b.votes - a.votes);

  // Vérifier showAdminLogin en premier pour qu'il puisse s'afficher par-dessus tout
  if (showAdminLogin) {

    return (

      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-6">

        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">

          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Accès Administrateur</h2>

          

          <div className="space-y-4">

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-2">

                Mot de passe

              </label>

              <input

                type="password"

                value={adminPassword}

                onChange={(e) => setAdminPassword(e.target.value)}

                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}

                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"

                placeholder="Entrez le mot de passe"

                autoFocus

              />

            </div>

            

            <div className="flex gap-3">

              <button

                onClick={() => {

                  setShowAdminLogin(false);

                  setAdminPassword('');

                  setLoginType(null);

                }}

                className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"

              >

                Annuler

              </button>

              <button

                onClick={handleAdminLogin}

                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"

              >

                Connexion

              </button>

            </div>

          </div>

        </div>

      </div>

    );

  }

  if (stage === 'scan') {

    return (

      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-6">

        <div className="max-w-2xl mx-auto">

          <div className="bg-white rounded-lg shadow-2xl p-8">

            <div className="text-center mb-8">

              <h1 className="text-3xl font-bold text-gray-800 mb-2">Élections Étudiantes 2025</h1>

              <p className="text-gray-600">Scannez ou importez votre carte étudiante</p>

              <p className="text-sm text-blue-600 font-semibold mt-2">🏛️ Réservé aux étudiants de Tanguiéta</p>

              

              <button

                onClick={() => setShowAdminLogin(true)}

                className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"

              >

                Accès Administrateur

              </button>

            </div>

            {!capturedImage ? (

              <div className="space-y-4">

                {!stream ? (

                  <>

                    {!isMobile ? (

                      <button

                        onClick={startCamera}

                        className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"

                      >

                        <Camera size={24} />

                        Activer la caméra

                      </button>

                    ) : (

                      <label className="block w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition text-center cursor-pointer">

                        📸 Importer une photo de la carte

                        <input

                          type="file"

                          accept="image/*"

                          capture="environment"

                          onChange={handleFileUpload}

                          className="hidden"

                        />

                      </label>

                    )}

                  </>

                ) : (

                  <div className="space-y-4">

                    <div className="relative bg-black rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>

                      <video

                        ref={videoRef}

                        autoPlay

                        playsInline

                        muted

                        className="w-full rounded-lg"

                      />

                    </div>

                    <button

                      onClick={capturePhoto}

                      className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition"

                    >

                      📸 Capturer la carte

                    </button>

                  </div>

                )}

                <canvas ref={canvasRef} className="hidden" />

              </div>

            ) : (

              <div className="space-y-4">

                <img src={capturedImage} alt="Carte captée" className="w-full rounded-lg shadow-lg" />

                

                {!verifying && !verificationError && (

                  <div className="flex gap-4">

                    <button

                      onClick={() => {

                        setCapturedImage(null);

                        setVerificationError('');

                        setStream(null);

                      }}

                      className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"

                    >

                      Reprendre

                    </button>

                    <button

                      onClick={verifyCard}

                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"

                    >

                      Vérifier

                    </button>

                  </div>

                )}

                {verifying && (

                  <div className="text-center py-8">

                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>

                    <p className="text-gray-600 font-semibold">Vérification de la carte en cours...</p>

                    <p className="text-sm text-gray-500 mt-2">Extraction des données et validation</p>

                  </div>

                )}

                {verificationError && (

                  <div className="bg-red-100 border-2 border-red-500 rounded-lg p-6">

                    <div className="flex items-start gap-3">

                      <AlertCircle size={24} className="text-red-500 flex-shrink-0 mt-1" />

                      <div>

                        <p className="text-red-700 font-bold text-lg">Erreur de vérification</p>

                        <p className="text-red-600 mt-2">{verificationError}</p>

                      </div>

                    </div>

                    <button

                      onClick={() => {

                        setCapturedImage(null);

                        setVerificationError('');

                      }}

                      className="w-full mt-4 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition"

                    >

                      Réessayer

                    </button>

                  </div>

                )}

              </div>

            )}

          </div>

        </div>

      </div>

    );

  }

  if (stage === 'voting') {

    return (

      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-6">

        <div className="max-w-4xl mx-auto">

          <div className="bg-white rounded-lg shadow-2xl p-8">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">

              <div>

                <h1 className="text-3xl font-bold text-gray-800">Votez maintenant</h1>

                <p className="text-gray-600">
                  <span className="font-semibold">Nom:</span> {cardData?.lastName || ''} <span className="font-semibold">Prénom:</span> {cardData?.firstName || ''}
                </p>

                <p className="text-sm text-gray-500">
                  <span className="font-semibold">Lieu (At):</span> {cardData?.at || cardData?.city || 'Non spécifié'} 
                  {cardData?.country && ` • ${cardData.country}`}
                  {cardData?.validityDate && ` • Valide: ${cardData.validityDate}`}
                  {!cardData?.validityDate && cardData?.validUntil && ` • Valide jusqu'au ${cardData.validUntil}`}
                </p>

              </div>

              <div className="flex items-center gap-2 bg-red-100 px-6 py-3 rounded-lg">

                <Clock className="text-red-600" size={24} />

                <span className="text-2xl font-bold text-red-600">

                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}

                </span>

              </div>

            </div>

            <div className="grid gap-4 mb-6">

              {candidates.map(candidate => (

                <button

                  key={candidate.id}

                  onClick={() => setSelectedCandidate(candidate.id)}

                  className={`p-6 rounded-lg border-2 transition-all ${

                    selectedCandidate === candidate.id

                      ? 'border-blue-600 bg-blue-50 shadow-lg'

                      : 'border-gray-300 hover:border-blue-400 hover:shadow'

                  }`}

                >

                  <div className="flex items-center gap-4">

                    <div className={`w-3 h-3 rounded-full ${candidate.color}`}></div>

                    <div className="text-left flex-1">

                      <h3 className="text-xl font-bold text-gray-800">{candidate.name}</h3>

                      <p className="text-gray-600">{candidate.party}</p>

                    </div>

                    {selectedCandidate === candidate.id && (

                      <CheckCircle className="text-blue-600" size={32} />

                    )}

                  </div>

                </button>

              ))}

            </div>

            <button

              onClick={submitVote}

              disabled={!selectedCandidate}

              className={`w-full py-4 rounded-lg font-bold text-white text-lg transition ${

                selectedCandidate

                  ? 'bg-green-600 hover:bg-green-700'

                  : 'bg-gray-400 cursor-not-allowed'

              }`}

            >

              Confirmer mon vote

            </button>

          </div>

        </div>

      </div>

    );

  }

  if (stage === 'voted') {

    return (

      <div className="min-h-screen bg-gradient-to-br from-green-900 to-blue-900 flex items-center justify-center p-6">

        <div className="bg-white rounded-lg shadow-2xl p-12 text-center max-w-md">

          <CheckCircle size={80} className="text-green-600 mx-auto mb-6" />

          <h2 className="text-3xl font-bold text-gray-800 mb-4">Vote enregistré !</h2>

          <p className="text-gray-600 mb-2">Merci {cardData?.name}</p>

          <p className="text-sm text-gray-500 mb-6">Votre participation compte pour nos élections étudiantes.</p>

          <p className="text-xs text-gray-400">Redirection automatique...</p>

        </div>

      </div>

    );

  }

  if (stage === 'admin_dashboard' && userRole === 'admin') {

    return (

      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-6">

        <div className="max-w-4xl mx-auto">

          <div className="bg-white rounded-lg shadow-2xl p-8">

            <div className="text-center mb-8">

              <Shield size={64} className="text-blue-500 mx-auto mb-4" />

              <h1 className="text-4xl font-bold text-gray-800 mb-2">Tableau de bord Admin</h1>

              <p className="text-gray-600">Gestion des élections</p>

            </div>

            

            <div className="space-y-6">

              <div className="bg-blue-50 rounded-lg p-6">

                <h2 className="text-xl font-bold text-gray-800 mb-4">Statut de l'élection</h2>

                <div className="space-y-2">

                  <p className="text-gray-700">

                    <span className="font-semibold">État :</span>{' '}

                    {electionStatus === 'not_started' && 'Non démarrée'}

                    {electionStatus === 'active' && 'En cours'}

                    {electionStatus === 'results_available' && 'Résultats disponibles'}

                  </p>

                  

                  {electionStatus === 'active' && timeUntilResults !== null && (

                    <p className="text-gray-700">

                      <span className="font-semibold">Résultats dans :</span>{' '}

                      {Math.floor(timeUntilResults / 60000)}:{(Math.floor((timeUntilResults % 60000) / 1000)).toString().padStart(2, '0')}

                    </p>

                  )}

                </div>

              </div>

              

              {electionStatus === 'not_started' && (

                <>

                  {!showElectionConfig ? (

                    <>

                      {candidates.length === 0 ? (

                        <button

                          onClick={() => setShowElectionConfig(true)}

                          className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"

                        >

                          <Calendar size={24} />

                          Configurer l'élection

                        </button>

                      ) : (

                        <div className="space-y-4">

                          <div className="bg-green-50 rounded-lg p-4">

                            <p className="text-green-800 font-semibold mb-2">Configuration actuelle :</p>

                            <ul className="list-disc list-inside text-green-700">

                              {candidates.map((c, idx) => (

                                <li key={c.id}>{idx + 1}. {c.name}</li>

                              ))}

                            </ul>

                          </div>

                          <div className="flex gap-3">

                            <button

                              onClick={() => setShowElectionConfig(true)}

                              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"

                            >

                              Modifier la configuration

                            </button>

                            <button

                              onClick={startElection}

                              className="flex-1 bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"

                            >

                              <Play size={24} />

                              Lancer les élections

                            </button>

                          </div>

                        </div>

                      )}

                    </>

                  ) : (

                    <div className="bg-gray-50 rounded-lg p-6 space-y-6">

                      <h3 className="text-2xl font-bold text-gray-800">Configuration de l'élection</h3>

                      

                      <div>

                        <label className="block text-sm font-medium text-gray-700 mb-2">

                          Nombre de partis (2-8)

                        </label>

                        <input

                          type="number"

                          min="2"

                          max="8"

                          value={numberOfParties}

                          onChange={(e) => handlePartyCountChange(e.target.value)}

                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"

                        />

                      </div>

                      

                      <div className="space-y-4">

                        <label className="block text-sm font-medium text-gray-700">

                          Noms des partis :

                        </label>

                        {partyNames.map((name, index) => (

                          <div key={index}>

                            <label className="block text-xs text-gray-600 mb-1">

                              Parti {index + 1}

                            </label>

                            <input

                              type="text"

                              value={name}

                              onChange={(e) => handlePartyNameChange(index, e.target.value)}

                              placeholder={`Nom du parti ${index + 1}`}

                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"

                            />

                          </div>

                        ))}

                      </div>

                      

                      <div className="flex gap-3">

                        <button

                          onClick={() => {

                            setShowElectionConfig(false);

                            if (candidates.length > 0) {

                              setPartyNames(candidates.map(c => c.name));

                              setNumberOfParties(candidates.length);

                            }

                          }}

                          className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"

                        >

                          Annuler

                        </button>

                        <button

                          onClick={saveElectionConfig}

                          className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"

                        >

                          Enregistrer la configuration

                        </button>

                      </div>

                    </div>

                  )}

                </>

              )}

              

              {electionStatus === 'results_available' && (

                <button

                  onClick={() => setStage('results')}

                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"

                >

                  <Award size={24} />

                  Voir les résultats

                </button>

              )}

              

              <button

                onClick={() => {

                  setUserRole(null);

                  setStage('scan');

                }}

                className="w-full bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"

              >

                Déconnexion

              </button>

            </div>

          </div>

        </div>

      </div>

    );

  }

  if (stage === 'results') {

    if (!canViewResults()) {

      return (

        <div className="min-h-screen bg-gradient-to-br from-red-900 to-purple-900 flex items-center justify-center p-6">

          <div className="bg-white rounded-lg shadow-2xl p-12 text-center max-w-md">

            <XCircle size={80} className="text-red-600 mx-auto mb-6" />

            <h2 className="text-3xl font-bold text-gray-800 mb-4">Accès refusé</h2>

            {userRole === 'admin' && electionStatus === 'active' && timeUntilResults !== null && (

              <p className="text-gray-600 mb-4">

                Les résultats seront disponibles dans : {Math.floor(timeUntilResults / 60000)}:{(Math.floor((timeUntilResults % 60000) / 1000)).toString().padStart(2, '0')}

              </p>

            )}

            <p className="text-gray-600 mb-6">

              {userRole === 'admin' ? 'Les résultats ne sont pas encore disponibles.' : 'Seuls les administrateurs peuvent consulter les résultats.'}

            </p>

            <button

              onClick={() => {

                if (userRole === 'admin') {

                  setStage('admin_dashboard');

                } else {

                  resetPlatform();

                }

              }}

              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"

            >

              Retour

            </button>

          </div>

        </div>

      );

    }

    

    const displayVotes = editingVotes ? tempVotes : votes;

    const displayTotal = Object.values(displayVotes).reduce((a, b) => a + b, 0);

    const displayResults = candidates.map(c => ({

      ...c,

      votes: displayVotes[c.id] || 0,

      percentage: displayTotal > 0 ? ((displayVotes[c.id] || 0) / displayTotal * 100).toFixed(1) : 0

    })).sort((a, b) => b.votes - a.votes);

    

    return (

      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 p-6">

        <div className="max-w-4xl mx-auto">

          <div className="bg-white rounded-lg shadow-2xl p-8">

            <div className="text-center mb-8">

              <Award size={64} className="text-yellow-500 mx-auto mb-4" />

              <h1 className="text-4xl font-bold text-gray-800 mb-2">Résultats des élections</h1>

              <p className="text-gray-600 text-lg">Total des votes : {displayTotal}</p>

              {userRole === 'superadmin' && canModifyVotes() && !editingVotes && (

                <button

                  onClick={() => setEditingVotes(true)}

                  className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center gap-2 mx-auto"

                >

                  <Edit2 size={20} />

                  Modifier les votes

                </button>

              )}

              {editingVotes && (

                <div className="mt-4 flex gap-2 justify-center">

                  <button

                    onClick={saveVoteChanges}

                    className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition"

                  >

                    Enregistrer

                  </button>

                  <button

                    onClick={cancelVoteChanges}

                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"

                  >

                    Annuler

                  </button>

                </div>

              )}

            </div>

            <div className="space-y-6 mb-8">

              {displayResults.map((candidate, index) => (

                <div key={candidate.id} className="relative">

                  <div className="flex justify-between items-center mb-2">

                    <div className="flex items-center gap-3">

                      {index === 0 && <Award className="text-yellow-500" size={24} />}

                      <span className="font-bold text-gray-800">{candidate.name}</span>

                    </div>

                    {editingVotes ? (

                      <div className="flex items-center gap-2">

                        <button

                          onClick={() => updateVote(candidate.id, (displayVotes[candidate.id] || 0) - 1)}

                          className="bg-red-500 text-white w-8 h-8 rounded-full hover:bg-red-600 transition"

                        >

                          -

                        </button>

                        <input

                          type="number"

                          value={displayVotes[candidate.id] || 0}

                          onChange={(e) => updateVote(candidate.id, e.target.value)}

                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center"

                          min="0"

                        />

                        <button

                          onClick={() => updateVote(candidate.id, (displayVotes[candidate.id] || 0) + 1)}

                          className="bg-green-500 text-white w-8 h-8 rounded-full hover:bg-green-600 transition"

                        >

                          +

                        </button>

                      </div>

                    ) : (

                      <span className="font-bold text-gray-800">{candidate.votes} votes ({candidate.percentage}%)</span>

                    )}

                  </div>

                  <div className="h-8 bg-gray-200 rounded-full overflow-hidden">

                    <div

                      className={`h-full ${candidate.color} transition-all duration-1000`}

                      style={{ width: `${candidate.percentage}%` }}

                    ></div>

                  </div>

                  <p className="text-sm text-gray-500 mt-1">{candidate.party}</p>

                </div>

              ))}

            </div>

            {userRole === 'admin' ? (

              <button

                onClick={() => setStage('admin_dashboard')}

                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition mb-4"

              >

                Retour au tableau de bord

              </button>

            ) : (

              <button

                onClick={resetPlatform}

                className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition mb-4"

              >

                Retour à l'accueil

              </button>

            )}

            

            <button

              onClick={() => {

                setUserRole(null);

                resetPlatform();

              }}

              className="w-full bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"

            >

              Déconnexion

            </button>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">

              <p className="text-sm text-gray-600 text-center">

                <Users className="inline mr-2" size={16} />

                {votedStudents.size} étudiants ont déjà voté

              </p>

            </div>

          </div>

        </div>

      </div>

    );

  }

  return null;

};

export default VotingPlatform;

