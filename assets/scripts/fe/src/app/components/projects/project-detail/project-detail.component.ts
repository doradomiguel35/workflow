import { Component, OnInit, HostListener } from '@angular/core';
import { StateService } from '@uirouter/angular';
import { StandupService } from '../../../commons/services/history/standup.service'
import { NavService } from '../../../commons/services/utils/nav.service';
import { ProjectService } from '../../../commons/services/project/project.service'

import { DateRange } from '../../../commons/utils/datetime.utils'

@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.css']
})
export class ProjectDetailComponent implements OnInit {

  constructor(
    private projectservice : ProjectService,
    private standupservice : StandupService,
    private state          : StateService,
    private nav            : NavService,
  ) 
  {
    // nav configuration
    // TODO: this sucks!. find a better solution
    this.nav.setNav('Project Detail', true);
  }

  ngOnInit() {

    if ((!this.standupservice.noreload && this.state.$current.name !== 'project-detail-report') || 
      (this.state.$current.name === 'project-detail-report' && this.standupservice.q.length < 1)) 
    {
      // set date range parameters into today
      this.standupservice.dateData = DateRange()
      // clear all fields
      this.standupservice.revertWeeklyReport()
      // get the project detail
      this.projectservice.getProjectDetail(this.state.params.id)
      // get all blockers of project
      this.projectservice.getProjectBlockers(this.state.params.id)
      // get all weekly reports
      this.standupservice.getWeeklyReport(this.state.params.id)
    }
    else {
      // enable reload for template data
      this.standupservice.noreload = false;
    }
  }

  updateWeeklyReport(date){
    // apply computations to set new start and end week
    this.standupservice.dateData = DateRange(date)
    // re-initialize Weekly Report data and query parameters
    this.standupservice.revertWeeklyReport()
    // get weekly report base on new week
    this.standupservice.getWeeklyReport(this.state.params.id)
  }

  previousWeek($event){
    // prevent default action of href to redirect
    $event.preventDefault();
    // deduct 1 day to week start date to get previous week
    this.standupservice.dateData.dateStart.setDate(this.standupservice.dateData.dateStart.getDate() - 1)
    // apply computations to set new start and end week
    this.updateWeeklyReport(this.standupservice.dateData.dateStart)
  }

  nextWeek($event){
    // prevent default action of href to redirect
    $event.preventDefault()
    // add 1 day to week end date to get next week
    this.standupservice.dateData.dateEnd.setDate(this.standupservice.dateData.dateEnd.getDate() + 1)
    // apply computations to set new start and end week
    this.updateWeeklyReport(this.standupservice.dateData.dateEnd)
  }

  onDateSelect($event){
    // get the date time picker result
    let date = new Date($event.year + "-" + $event.month + "-" + $event.day) 
    // apply computations to set new start and end week
    this.updateWeeklyReport(date)
  }

  @HostListener('scroll', ['$event']) 
  scrollWeeklyReport(event): void {
    // captures the scroll event on the WeeklyReport-section.
    // it handles the call to the backend when the scroll
    // reach its max height.
    let cHeight = event.target.scrollHeight;
    this.standupservice.scrollHeight = event.target.scrollTop;

    // offset height. this is the sum of the margin/interval
    // of each element inside the `cHeight`. can change based
    // on the design template.
    // margin-height: 581, spacing-height: 100 # spacer so that this
    // sends a call to the backend before the user reach the last item.
    let maxHeight = cHeight - (581 + 100);

    if(this.standupservice.scrollHeight >= maxHeight) {
      // load more weekly report once target height is reached
      this.standupservice.loadMoreWeeklyReport(this.state.params.id)
    }
  }
}
