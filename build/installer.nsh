!macro customHeader
!macroend

!macro customInstall
  CreateDirectory "$DOCUMENTS\Anima Projects"
!macroend

!macro customUnInstall
  MessageBox MB_YESNO "Do you want to delete your saved projects in Documents too?" IDNO keepProjects
    RMDir /r "$DOCUMENTS\Anima Projects"
  keepProjects:
!macroend