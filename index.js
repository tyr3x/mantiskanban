var LoadingIssuesList = new Array();


window.onload = function() {

	document.getElementById("username").focus();

	$("#edit-reporter").chosen();
	$("#edit-assignedto").chosen();
	$("#edit-status").chosen();
	$("#edit-priority").chosen();

	$("#add-reporter").chosen();
	$("#add-assignedto").chosen();
	$("#add-status").chosen();
	$("#add-custom-field").chosen();
	$("#add-priority").chosen();
	$("#add-category").chosen();

	$("#user-context-menu").hide();
	
	$(function() {
		$( "#tabs" ).tabs({ heightStyle: "content" });
	});
		
	$(function() {
		$( document ).tooltip();
	});
		
	$(function() {
		$("#accordion-desc").accordion();	
	});
	
	$( "#story-form" ).dialog({
		autoOpen: false,
		height: 650,
		width: 640,
		modal: true,
		buttons: {
			"Create a story": function() {
				Kanban.AddStoryFromFormData();
			},
			Cancel: function() {
				$( this ).dialog( "close" );
			}
		},
		close: function() {
			
		}
	});

	$("#edit-story-form").dialog({
		autoOpen: false,
		modal: true,
		height: 630,
		width: 780,
		close: function() {
			
		},
		buttons: {
			"Save": function() {
				UpdateStoryFromFormData();
			 ///Code here to add a story to a list 
			},
			Cancel: function() {
				$( this ).dialog( "close" );
			}
		}
	});
}

 
function Login() {
	
	StartLoading();
	
	document.getElementById("username").focus();
	Mantis.CurrentUser.UserName = document.getElementById("username").value;
	Mantis.CurrentUser.Password = document.getElementById("password").value;
	
	LoadKanbanProjects();
	BuildProjectsGUI();
	BuildUserSelector();
	
	HideLoginArea();
	ShowProjectArea();
	
	SelectProject();

	StopLoading();
}

function BuildUserSelector() {

	var userContextMenu = document.getElementById("user-context-menu");

	try { while(userContextMenu.children.length > 1) { userContextMenu.removeChild(1); } } catch(e) { }

	for(var ui = 0; ui < Mantis.ProjectUsers.length; ui++) {
		var thisMantisUser = Mantis.ProjectUsers[ui];
		var storyDivMenuItem = document.createElement("li");
		storyDivMenuItem.setAttribute("userid", thisMantisUser.id);
		storyDivMenuItem.setAttribute("onmouseout", "event.stopPropagation();");
		userContextMenu.appendChild(storyDivMenuItem);

		var storyDivMenuItemLink = document.createElement("a");
		storyDivMenuItemLink.setAttribute("href", "#");
		storyDivMenuItemLink.setAttribute("userid", thisMantisUser.id);
		storyDivMenuItemLink.innerHTML = thisMantisUser.real_name;
		storyDivMenuItem.appendChild(storyDivMenuItemLink);
	}	
}

function HideLoginArea() {
	$(".loginarea").hide();
}
function ShowLoginArea() {
	$(".loginarea").show();
}

function ShowProjectArea() {
	$(".projectarea").show();
}

function HideProjectArea() {
	$(".projectarea").hide();
}

function Logout() {
	Kanban.Lists = [];
	Kanban.Stories = [];
	Kanban.Projects = [];
	Kanban.ClearListGUI();

	Mantis.ClearForLogout();
	
	HideProjectArea();
	ShowLoginArea();
}

function SelectProject() {
	StartLoading();

	Kanban.Lists = [];
	Kanban.Stories = [];
	Kanban.ClearListGUI();

	Mantis.CurrentProjectID = document.getElementById("seletedproject").value;

	BuildKanbanListFromMantisStatuses();
	
	Kanban.BuildListGUI();

	if(Mantis.DefaultFilterID !== null) {
		window.setTimeout(LoadFilterAsync(Mantis.DefaultFilterID, 0, 0, DoneLoadingIssuesCallback), 100);
		if(Mantis.ClosedIssuesFilterID !== null) {
			window.setTimeout(LoadFilterAsync(Mantis.ClosedIssuesFilterID, 1, Kanban.NumberOfClosedMessagesToLoad, DoneLoadingIssuesCallback), 100);
		}
	} else {
		var retObj = Mantis.ProjectGetIssues(Mantis.CurrentProjectID, 0, 0);
		CreateKanbanStoriesFromMantisIssues(retObj);
		StopLoading();
	}
}

function LoadFilterAsync(FilterID, Page, Limit, Callback) {
	var retObj = Mantis.FilterGetIssues(Mantis.CurrentProjectID, FilterID, Page, Limit);
	Callback(FilterID, retObj);
}

function DoneLoadingIssuesCallback(filterID, retObj) {
	CreateKanbanStoriesFromMantisIssues(retObj);
	LoadingIssuesList.splice(LoadingIssuesList.indexOf(filterID) -1, 1);
	if(LoadingIssuesList.length == 0) {
		console.log("Done Loading " + filterID);
		StopLoading();
	}
}

function StartLoading() {
	document.getElementById("loadedimage").style.display = "none";
	document.getElementById("loadingimage").style.display = "inline";
}

function StopLoading() {
	document.getElementById("loadingimage").style.display = "none";
	document.getElementById("loadedimage").style.display = "inline";
}

function BuildKanbanListFromMantisStatuses() {
	var hasCutomFieldForStatus = false;
	Kanban.UsingCustomField = false;
	if(Mantis.ProjectCustomFields.length > 0) {
		for(var cf = 0; cf < Mantis.ProjectCustomFields.length; cf++) {
			var customfield = Mantis.ProjectCustomFields[cf]
			if(customfield.field.name == Kanban._listIDField) {
				hasCutomFieldForStatus = true;
				Kanban.UsingCustomField = true;
				var possiblevalues = customfield.possible_values.split("|");
				for(var pv = 0; pv < possiblevalues.length; pv++ ) {
					possiblevalue = possiblevalues[pv];
					var newKanbanList = new KanbanList(possiblevalue);
					newKanbanList.UsesCustomField = true;
					Kanban.AddListToArray(newKanbanList);
				}
			}
		}
	}
	if(!Kanban.UsingCustomField) {
		for(var si = 0; si < Mantis.Statuses.length; si++) {
			var status = Mantis.Statuses[si]
			Kanban.AddListToArray(new KanbanList(status));
		}
	}
}


function SwapSelectedProject(newProjectID) {
	var nodeList = document.getElementsByClassName("projectbutton");
	for(var i = 0; i < nodeList.length; i++) {
		if(nodeList[i].id == newProjectID) {
			nodeList[i].setAttribute("selected", "true");
		} else {
			nodeList[i].setAttribute("selected", "false");
		}
		
	}
}

function LoadKanbanProjects() {
	for(var i = 0; i < Mantis.UserProjects.length; i++) {
		Kanban.Projects[i] = new KanbanProject(Mantis.UserProjects[i]);
	}
}

function BuildProjectsGUI() {
	var projectDivContainer = document.getElementById("projectlist");
	try { while(projectDivContainer.childNodes.length > 0) { projectDivContainer.removeChild(projectDivContainer.firstChild); } } catch(e) { }
	for(var i = 0; i < Kanban.Projects.length; i++) {
		var projectDiv = document.createElement("div");
		projectDiv.setAttribute("class", "projectbutton");
		projectDiv.setAttribute("id", "project" + Kanban.Projects[i].ID);
		projectDiv.setAttribute("onclick", "document.getElementById('seletedproject').value = '" + Kanban.Projects[i].ID + "'; SelectProject(); SwapSelectedProject(this.id);");
		projectDiv.setAttribute("selected", i == 0 ? "true" : "false");
		projectDiv.innerHTML = Kanban.Projects[i].Name;
		projectDivContainer.appendChild(projectDiv);
	}
	document.getElementById("seletedproject").value = Kanban.Projects[0].ID;
}

function SelectFirstMantisProjectUserAccessAccessTo(obj, doc) {
	Mantis.CurrentProjectID = obj[0].id;
}

function CreateKanbanStoriesFromMantisIssues(obj) {
	for(var is = 0; is < obj.length; is++) {
		Kanban.AddStoryToArray(new KanbanStory(obj[is]));
	}
	
}
