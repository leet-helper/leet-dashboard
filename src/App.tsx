import React from "react";
import Sidebar from "./components/Sidebar";
import MainProblemViewer from "./components/questions/MainProblemViewer";
import VerbalProblemViewer from "./components/questions/VerbalProblemViewer";
import BackgroundKnowledgeViewer from "./components/background/BackgroundKnowledgeViewer";
import FreeNoteViewer from "./components/freenote/FreeNoteViewer";
import MinigameViewer from "./components/minigame/MinigameViewer";
import CartDrawer from "./components/questions/CartDrawer";
import FocusModeOverlay from "./components/questions/FocusModeOverlay";
import WeaknessModal from "./components/questions/WeaknessModal";
import EditProblemModal from "./components/questions/EditProblemModal";
import OrigImageModal from "./components/questions/OrigImageModal";

import useDashboard from "./hooks/useDashboard";
import PrintExamSheet from "./components/questions/PrintExamSheet";
import TimerViewer from "./components/minigame/TimerViewer";

function App() {
  const [activeSubGame, setActiveSubGame] = React.useState("misreading");
  const [activeTimerMode, setActiveTimerMode] = React.useState("language");
  const {
    theme, setTheme,
    selectedSources, setSelectedSources,
    examData,
    isLoading,
    loadError,
    currentUser, setCurrentUser,
    isAuthOpen, setIsAuthOpen,
    authMode, setAuthMode,
    authUsername, setAuthUsername,
    authPassword, setAuthPassword,
    authError, setAuthError,
    savedWorkbooks, setSavedWorkbooks,
    notes,
    solvedRecords,
    generatedProblems,
    openaiApiKey, setOpenaiApiKey,
    selectedRefProblems,
    refYear, setRefYear,
    refNumber, setRefNumber,
    onlyWrong, setOnlyWrong,
    onlyStatute, setOnlyStatute,
    activeMemos, setActiveMemos,
    visibleAnswers, setVisibleAnswers,
    visibleHints, setVisibleHints,
    isDrawMode, setIsDrawMode,
    canvasDrawings, setCanvasDrawings,
    brushColor, setBrushColor,
    brushWidth, setBrushWidth,
    brushType, setBrushType,
    singleViewType, setSingleViewType,
    isApiKeyOpen, setIsApiKeyOpen,
    isGeneratorOpen, setIsGeneratorOpen,
    isWeaknessOpen, setIsWeaknessOpen,
    isEditModalOpen, setIsEditModalOpen,
    genCategory, setGenCategory,
    genPrompt, setGenPrompt,
    isGenerating,
    editProblem, setEditProblem,
    isAnalyzing,
    weaknessPrompt, setWeaknessPrompt,
    weaknessReport, setWeaknessReport,
    searchQuery, setSearchQuery,
    selectedEvals, setSelectedEvals,
    selectedContents, setSelectedContents,
    selectedDetailTypes, setSelectedDetailTypes,
    numberFilterMode, setNumberFilterMode,
    numberFilterStart, setNumberFilterStart,
    numberFilterEnd, setNumberFilterEnd,
    numberFilterSpecificText, setNumberFilterSpecificText,
    cart, setCart,
    isSingleView, setIsSingleView,
    singleViewIndex, setSingleViewIndex,
    isCartOpen, setIsCartOpen,
    examTitle, setExamTitle,
    compactPages,
    isFullscreen,
    selectedOrigImage, setSelectedOrigImage,
    isOrigImageModalOpen, setIsOrigImageModalOpen,
    officialEdits, setOfficialEdits,
    highlightedWords, setHighlightedWords,
    arrows, setArrows,
    dragStartKey, setDragStartKey,
    dragCurrentCoords, setDragCurrentCoords,
    dragTargetKey, setDragTargetKey,
    activeTab, setActiveTab,
    freeNotes, setFreeNotes,
    activeNoteId, setActiveNoteId,
    selectedCategory, setSelectedCategory,
    activeConceptId, setActiveConceptId,
    knowledgeData,
    isKnowledgeLoading,
    quizState, setQuizState,
    podcastState, setPodcastState,
    debateState, setDebateState,
    selectedConceptIds, setSelectedConceptIds,
    fusionPassageState, setFusionPassageState,
    completedConceptIds, toggleConceptCompleted,
    bookmarkLists, createBookmarkList, deleteBookmarkList, toggleBookmarkMember,
    problemBookmarkLists, setProblemBookmarkLists,
    selectedProblemBookmarkListId, setSelectedProblemBookmarkListId,
    activeProblemBookmarkDropdownKey, setActiveProblemBookmarkDropdownKey,
    createProblemBookmarkList, deleteProblemBookmarkList, toggleProblemBookmarkMember,

    // Handlers
    toggleFullscreen,
    loadOfficialEdits,
    loadUserData,
    toggleDetailCategory,
    filteredProblems,
    problemsToSolve,
    toggleCart,
    clearCart,
    addAllFilteredToCart,
    handlePrint,
    handleSelectOption,
    handleSaveMemo,
    handleAddRefProblem,
    handleRemoveRefProblem,
    handleGenerateAIProblem,
    handleDeleteGenerated,
    handleEditGeneratedSubmit,
    handleGenerateWeaknessReport,
    loadSavedWorkbooks,
    handleAuthSubmit,
    handleNavigateToProblem,
    handleGenerateQuiz,
    handleSelectQuizOption,
    handleGeneratePodcast,
    handlePlayPodcast,
    handleStopPodcast,
    handleStartDebate,
    handleSendDebateMessage,
    toggleSelectConcept,
    handleGenerateFusionPassage,
    handleSelectFusionOption,
    isCartShuffled,
    toggleCartShuffle,
    isVerbal
  } = useDashboard();

  return (
    <div className="app-container">
      {/* Background glow graphics */}
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>

      {/* 1. SIDEBAR FOR FILTERS */}
      <Sidebar
        theme={theme}
        setTheme={setTheme}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        openaiApiKey={openaiApiKey}
        setIsApiKeyOpen={setIsApiKeyOpen}
        setIsGeneratorOpen={setIsGeneratorOpen}
        onlyWrong={onlyWrong}
        setOnlyWrong={setOnlyWrong}
        onlyStatute={onlyStatute}
        setOnlyStatute={setOnlyStatute}
        setWeaknessReport={setWeaknessReport}
        setIsWeaknessOpen={setIsWeaknessOpen}
        selectedSources={selectedSources}
        setSelectedSources={setSelectedSources}
        generatedProblems={generatedProblems}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedEvals={selectedEvals}
        setSelectedEvals={setSelectedEvals}
        selectedContents={selectedContents}
        setSelectedContents={setSelectedContents}
        selectedDetailTypes={selectedDetailTypes}
        setSelectedDetailTypes={setSelectedDetailTypes}
        numberFilterMode={numberFilterMode}
        setNumberFilterMode={setNumberFilterMode}
        numberFilterStart={numberFilterStart}
        setNumberFilterStart={setNumberFilterStart}
        numberFilterEnd={numberFilterEnd}
        setNumberFilterEnd={setNumberFilterEnd}
        numberFilterSpecificText={numberFilterSpecificText}
        setNumberFilterSpecificText={setNumberFilterSpecificText}
        setIsAuthOpen={setIsAuthOpen}
        setAuthError={setAuthError}
        toggleDetailCategory={toggleDetailCategory}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        knowledgeData={knowledgeData}
        freeNotes={freeNotes}
        setFreeNotes={setFreeNotes}
        activeNoteId={activeNoteId}
        setActiveNoteId={setActiveNoteId}
        problemBookmarkLists={problemBookmarkLists}
        selectedProblemBookmarkListId={selectedProblemBookmarkListId}
        setSelectedProblemBookmarkListId={setSelectedProblemBookmarkListId}
        createProblemBookmarkList={createProblemBookmarkList}
        deleteProblemBookmarkList={deleteProblemBookmarkList}
        activeSubGame={activeSubGame}
        setActiveSubGame={setActiveSubGame}
        activeTimerMode={activeTimerMode}
        setActiveTimerMode={setActiveTimerMode}
      />

      {/* 2. MAIN PROBLEM VIEWER AREA / BACKGROUND KNOWLEDGE VIEW / FREE NOTE VIEW */}
      {(activeTab === "reasoning_problems" || activeTab === "problems") ? (
        <MainProblemViewer
          selectedSources={selectedSources}
          examData={examData}
          isLoading={isLoading}
          loadError={loadError}
          filteredProblems={filteredProblems}
          cart={cart}
          toggleCart={toggleCart}
          addAllFilteredToCart={addAllFilteredToCart}
          setIsCartOpen={setIsCartOpen}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
          isSingleView={isSingleView}
          singleViewType={singleViewType}
          setSingleViewType={setSingleViewType}
          singleViewIndex={singleViewIndex}
          setSingleViewIndex={setSingleViewIndex}
          solvedRecords={solvedRecords}
          handleSelectOption={handleSelectOption}
          notes={notes}
          handleSaveMemo={handleSaveMemo}
          activeMemos={activeMemos}
          setActiveMemos={setActiveMemos}
          visibleAnswers={visibleAnswers}
          setVisibleAnswers={setVisibleAnswers}
          visibleHints={visibleHints}
          setVisibleHints={setVisibleHints}
          currentUser={currentUser}
          setEditProblem={setEditProblem}
          setIsEditModalOpen={setIsEditModalOpen}
          setSelectedOrigImage={setSelectedOrigImage}
          setIsOrigImageModalOpen={setIsOrigImageModalOpen}
          handleDeleteGenerated={handleDeleteGenerated}
          setIsSingleView={setIsSingleView}
          problemBookmarkLists={problemBookmarkLists}
          activeProblemBookmarkDropdownKey={activeProblemBookmarkDropdownKey}
          setActiveProblemBookmarkDropdownKey={setActiveProblemBookmarkDropdownKey}
          createProblemBookmarkList={createProblemBookmarkList}
          toggleProblemBookmarkMember={toggleProblemBookmarkMember}
        />
      ) : activeTab === "verbal_problems" ? (
        <VerbalProblemViewer
          selectedSources={selectedSources}
          examData={examData}
          isLoading={isLoading}
          loadError={loadError}
          filteredProblems={filteredProblems}
          cart={cart}
          toggleCart={toggleCart}
          addAllFilteredToCart={addAllFilteredToCart}
          setIsCartOpen={setIsCartOpen}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
          isSingleView={isSingleView}
          singleViewType={singleViewType}
          setSingleViewType={setSingleViewType}
          singleViewIndex={singleViewIndex}
          setSingleViewIndex={setSingleViewIndex}
          solvedRecords={solvedRecords}
          handleSelectOption={handleSelectOption}
          notes={notes}
          handleSaveMemo={handleSaveMemo}
          activeMemos={activeMemos}
          setActiveMemos={setActiveMemos}
          visibleAnswers={visibleAnswers}
          setVisibleAnswers={setVisibleAnswers}
          visibleHints={visibleHints}
          setVisibleHints={setVisibleHints}
          currentUser={currentUser}
          setEditProblem={setEditProblem}
          setIsEditModalOpen={setIsEditModalOpen}
          setSelectedOrigImage={setSelectedOrigImage}
          setIsOrigImageModalOpen={setIsOrigImageModalOpen}
          handleDeleteGenerated={handleDeleteGenerated}
          setIsSingleView={setIsSingleView}
          problemBookmarkLists={problemBookmarkLists}
          activeProblemBookmarkDropdownKey={activeProblemBookmarkDropdownKey}
          setActiveProblemBookmarkDropdownKey={setActiveProblemBookmarkDropdownKey}
          createProblemBookmarkList={createProblemBookmarkList}
          toggleProblemBookmarkMember={toggleProblemBookmarkMember}
          setCart={setCart}
        />
      ) : activeTab === "knowledge" ? (
        <BackgroundKnowledgeViewer
          theme={theme}
          knowledgeData={knowledgeData}
          isKnowledgeLoading={isKnowledgeLoading}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          activeConceptId={activeConceptId}
          setActiveConceptId={setActiveConceptId}
          searchQuery={searchQuery}

          setSearchQuery={setSearchQuery}
          quizState={quizState}
          setQuizState={setQuizState}
          podcastState={podcastState}
          setPodcastState={setPodcastState}
          debateState={debateState}
          setDebateState={setDebateState}
          selectedConceptIds={selectedConceptIds}
          setSelectedConceptIds={setSelectedConceptIds}
          fusionPassageState={fusionPassageState}
          setFusionPassageState={setFusionPassageState}
          handleNavigateToProblem={handleNavigateToProblem}
          handleGenerateQuiz={handleGenerateQuiz}
          handleSelectQuizOption={handleSelectQuizOption}
          handleGeneratePodcast={handleGeneratePodcast}
          handlePlayPodcast={handlePlayPodcast}
          handleStopPodcast={handleStopPodcast}
          handleStartDebate={handleStartDebate}
          handleSendDebateMessage={handleSendDebateMessage}
          toggleSelectConcept={toggleSelectConcept}
          handleGenerateFusionPassage={handleGenerateFusionPassage}
          handleSelectFusionOption={handleSelectFusionOption}
          setActiveTab={setActiveTab}
          completedConceptIds={completedConceptIds}
          toggleConceptCompleted={toggleConceptCompleted}
          currentUser={currentUser}
          bookmarkLists={bookmarkLists}
          createBookmarkList={createBookmarkList}
          deleteBookmarkList={deleteBookmarkList}
          toggleBookmarkMember={toggleBookmarkMember}
        />
      ) : activeTab === "freenote" ? (
        <FreeNoteViewer
          theme={theme}
          freeNotes={freeNotes}
          setFreeNotes={setFreeNotes}
          activeNoteId={activeNoteId}
          setActiveNoteId={setActiveNoteId}
        />
      ) : activeTab === "minigame" ? (
        <MinigameViewer
          theme={theme}
          activeSubGame={activeSubGame}
          currentUser={currentUser}
        />
      ) : (
        <TimerViewer
          theme={theme}
          activeTimerMode={activeTimerMode}
        />
      )}

      {/* 3. PRINT-ONLY EXAM SHEET CONTAINER (HIDDEN ON SCREEN) */}
      <PrintExamSheet cart={cart} compactPages={compactPages} isVerbal={activeTab === "verbal_problems"} />

      {/* 4. CART SLIDE-OUT PANEL (WORKBOOK COMPILER) */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        toggleCart={toggleCart}
        examTitle={examTitle}
        setExamTitle={setExamTitle}
        savedWorkbooks={savedWorkbooks}
        setSavedWorkbooks={setSavedWorkbooks}
        clearCart={clearCart}
        setIsSingleView={setIsSingleView}
        singleViewIndex={singleViewIndex}
        setSingleViewIndex={setSingleViewIndex}
        setSingleViewType={setSingleViewType}
        setIsAuthOpen={setIsAuthOpen}
        setAuthError={setAuthError}
        handlePrint={handlePrint}
        setCart={setCart}
        isVerbal={activeTab === "verbal_problems"}
      />

      {/* 8. AI WEAKNESS ANALYST REPORT MODAL */}
      <WeaknessModal
        isOpen={isWeaknessOpen}
        onClose={() => setIsWeaknessOpen(false)}
        isAnalyzing={isAnalyzing}
        weaknessPrompt={weaknessPrompt}
        setWeaknessPrompt={setWeaknessPrompt}
        weaknessReport={weaknessReport}
        setWeaknessReport={setWeaknessReport}
        onSubmit={handleGenerateWeaknessReport}
      />

      {/* 9. GENERATED PROBLEM EDIT MODAL */}
      <EditProblemModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        problem={editProblem}
        setProblem={setEditProblem}
        onSubmit={handleEditGeneratedSubmit}
      />

      {/* 9.5 ORIGINAL IMAGE CROP VIEW MODAL */}
      <OrigImageModal
        isOpen={isOrigImageModalOpen}
        onClose={() => setIsOrigImageModalOpen(false)}
        imageUrl={selectedOrigImage}
      />

      {/* 10. SINGLE VIEW FOCUS MODE OVERLAY MODAL */}
      <FocusModeOverlay
        isOpen={isSingleView}
        onClose={() => setIsSingleView(false)}
        problemsToSolve={problemsToSolve}
        singleViewIndex={singleViewIndex}
        setSingleViewIndex={setSingleViewIndex}
        solvedRecords={solvedRecords}
        handleSelectOption={handleSelectOption}
        notes={notes}
        handleSaveMemo={handleSaveMemo}
        activeMemos={activeMemos}
        setActiveMemos={setActiveMemos}
        visibleAnswers={visibleAnswers}
        setVisibleAnswers={setVisibleAnswers}
        visibleHints={visibleHints}
        setVisibleHints={setVisibleHints}
        cart={cart}
        toggleCart={toggleCart}
        isDrawMode={isDrawMode}
        setIsDrawMode={setIsDrawMode}
        canvasDrawings={canvasDrawings}
        setCanvasDrawings={setCanvasDrawings}
        brushColor={brushColor}
        setBrushColor={setBrushColor}
        brushWidth={brushWidth}
        setBrushWidth={setBrushWidth}
        brushType={brushType}
        setBrushType={setBrushType}
        arrows={arrows}
        setArrows={setArrows}
        dragStartKey={dragStartKey}
        setDragStartKey={setDragStartKey}
        dragCurrentCoords={dragCurrentCoords}
        setDragCurrentCoords={setDragCurrentCoords}
        dragTargetKey={dragTargetKey}
        setDragTargetKey={setDragTargetKey}
        highlightedWords={highlightedWords}
        setHighlightedWords={setHighlightedWords}
        currentUser={currentUser}
        setEditProblem={setEditProblem}
        setIsEditModalOpen={setIsEditModalOpen}
        setSelectedOrigImage={setSelectedOrigImage}
        setIsOrigImageModalOpen={setIsOrigImageModalOpen}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        problemBookmarkLists={problemBookmarkLists}
        activeProblemBookmarkDropdownKey={activeProblemBookmarkDropdownKey}
        setActiveProblemBookmarkDropdownKey={setActiveProblemBookmarkDropdownKey}
        createProblemBookmarkList={createProblemBookmarkList}
        toggleProblemBookmarkMember={toggleProblemBookmarkMember}
        isCartShuffled={isCartShuffled}
        toggleCartShuffle={toggleCartShuffle}
        isVerbal={isVerbal}
        singleViewType={singleViewType}
      />
    </div>
  );
}

export default App;
