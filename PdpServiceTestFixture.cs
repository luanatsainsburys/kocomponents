using JsPlc.Ssc.Link.Core.Notifications;
using JsPlc.Ssc.Link.Interfaces.Services;
using JsPlc.Ssc.Link.Models;
using JsPlc.Ssc.Link.Models.Entities;
using JsPlc.Ssc.Link.Repository;
using JsPlc.Ssc.Link.Service.Services;
using Moq;
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace JsPlc.Ssc.Link.Service.Tests.Services
{
    internal class PdpServiceTestFixture
    {
        LinkPdpSetView _pdpSet;

        PdpService _pdpService;

        private Mock<INotificationService> _notificationServiceMock = null;
        private Mock<IColleagueService> _colleagueServiceMock = null;
        private Mock<INotificationBuilder> _notificationBuilderMock = null;
        private Mock<IStaticService> _staticServiceMock = null;

        public PdpServiceTestFixture()
        {
            _pdpSet = new LinkPdpSetView
            {
                ColleagueId = ColleagueServiceTestFixture.ColleagueId,
                CreatedDate = DateTime.Today,
                SharedDate = DateTime.Today,
                UpdatedDate = DateTime.Today,
                Id = 9999,
                PdpQuestionGroup = new List<PdpQuestionGroupView>(),
            };
            PdpQuestionGroupView group1 = new PdpQuestionGroupView
            {
                CreatedDate = DateTime.Today,
                LinkPdpSetId = _pdpSet.Id,
                SectionId = 1

            };
            PdpQuestionGroupView group2 = new PdpQuestionGroupView
            {
                CreatedDate = DateTime.Today,
                LinkPdpSetId = _pdpSet.Id,
                SectionId = 2

            };
            PdpQuestionGroupView group3 = new PdpQuestionGroupView
            {
                CreatedDate = DateTime.Today,
                LinkPdpSetId = _pdpSet.Id,
                SectionId = 10

            };
            _pdpSet.PdpQuestionGroup.Add(group1);
            _pdpSet.PdpQuestionGroup.Add(group2);
            _pdpSet.PdpQuestionGroup.Add(group3);

            var Answers = new List<LinkPdpAnswerView> {
                    new LinkPdpAnswerView {
                        Answer = "Test answer 1",
                        LinkPdpQuestionId = 4,
                        LinkPdpSetId = _pdpSet.Id,
                        CreatedDate = DateTime.Today,
                        PdpQuestionGroup = _pdpSet.PdpQuestionGroup.First(f => f.SectionId ==1)

                    },
                    new LinkPdpAnswerView {
                        Answer = "Test answer 2",
                        LinkPdpQuestionId = 5,
                        LinkPdpSetId = _pdpSet.Id,
                        CreatedDate = DateTime.Today,
                         PdpQuestionGroup = _pdpSet.PdpQuestionGroup.First(f => f.SectionId ==1)
                    },
                    new LinkPdpAnswerView {
                        Answer = "Test answer 3",
                        LinkPdpQuestionId = 6,
                        LinkPdpSetId = _pdpSet.Id,
                        CreatedDate = DateTime.Today,
                         PdpQuestionGroup = _pdpSet.PdpQuestionGroup.First(f => f.SectionId ==1)
                    },

                    new LinkPdpAnswerView {
                        Answer = "Test answer 4",
                        LinkPdpQuestionId = 11,
                        LinkPdpSetId = _pdpSet.Id,
                        CreatedDate = DateTime.Today.AddMinutes(1),
                         PdpQuestionGroup = _pdpSet.PdpQuestionGroup.First(f => f.SectionId ==10)
                    },
                    new LinkPdpAnswerView {
                        Answer = "Test answer 5",
                        LinkPdpQuestionId = 12,
                        LinkPdpSetId = _pdpSet.Id,
                        CreatedDate = DateTime.Today.AddMinutes(1),
                         PdpQuestionGroup = _pdpSet.PdpQuestionGroup.First(f => f.SectionId ==10)
                    },
                    new LinkPdpAnswerView {
                        Answer = "Test answer 6",
                        LinkPdpQuestionId = 13,
                        LinkPdpSetId = _pdpSet.Id,
                        CreatedDate = DateTime.Today.AddMinutes(1),
                         PdpQuestionGroup = _pdpSet.PdpQuestionGroup.First(f => f.SectionId ==10)
                    }
                };
            _pdpSet.Answers = Answers;            

            _notificationServiceMock = new Mock<INotificationService>();
            _colleagueServiceMock = new Mock<IColleagueService>();
            _notificationBuilderMock = new Mock<INotificationBuilder>();
            _staticServiceMock = new Mock<IStaticService>();

            _pdpService = new PdpService(
                new RepositoryContext(),
                _notificationServiceMock.Object,
                _colleagueServiceMock.Object,
                _notificationBuilderMock.Object,
                _staticServiceMock.Object);
        }

        public static void ClearAllTestData()
        {
            using (var db = new RepositoryContext())
            {
                var pdpToBeDeleted = db.LinkPdpSet.Where(e => e.ColleagueId == ColleagueServiceTestFixture.ColleagueId).ToList();

                foreach (var pdpToDelete in pdpToBeDeleted)
                {
                    foreach (var pdpAnser in db.LinkPdpAnswer.Where(l => l.LinkPdpSetId == pdpToDelete.Id).ToList())
                    {
                        db.LinkPdpAnswer.Remove(pdpAnser);
                    }
                    foreach (var questiongroup in db.PdpQuestionGroup.Where(g => g.LinkPdpSetId == pdpToDelete.Id))
                    {
                        db.PdpQuestionGroup.Remove(questiongroup);
                    }


                    db.LinkPdpSet.Remove(pdpToDelete);
                }

                db.SaveChanges();
            }
        }

        public LinkPdpSetView BuildPdpSetTestData()
        {
            return this._pdpSet;
        }

        public LinkPdpSetView BuildPdpSetTestDataWithUnorderedAnswers()
        {
            var listItems = GetListItems();



            var testLinkset = new LinkPdpSetView
            {
                ColleagueId = ColleagueServiceTestFixture.ColleagueId,
                CreatedDate = DateTime.Today,
                SharedDate = DateTime.Today,
                UpdatedDate = DateTime.Today,
                Id = 1,
                PdpQuestionGroup = new List<PdpQuestionGroupView>()

            };
            PdpQuestionGroupView group1 = new PdpQuestionGroupView
            {
                CreatedDate = DateTime.Today,
                LinkPdpSetId = testLinkset.Id,
                SectionId = 1

            };
            PdpQuestionGroupView group2 = new PdpQuestionGroupView
            {
                CreatedDate = DateTime.Today,
                LinkPdpSetId = testLinkset.Id,
                SectionId = 2

            };
            testLinkset.PdpQuestionGroup.Add(group1);
            testLinkset.PdpQuestionGroup.Add(group2);



            //the order is deliberately different
            var Answers = new List<LinkPdpAnswerView> {
                    new LinkPdpAnswerView {
                        Answer = "Test answer 1",
                        LinkPdpQuestionId = 5,
                        LinkPdpSetId = 1,
                        Question = listItems.First(e => e.Id == 5),
                        CreatedDate = DateTime.Today,
                        PdpQuestionGroup = testLinkset.PdpQuestionGroup.First(f => f.SectionId ==1)

                    },
                    new LinkPdpAnswerView {
                        Answer = "Test answer 2",
                        LinkPdpQuestionId = 4,
                        LinkPdpSetId = 1,
                        Question = listItems.First(e => e.Id == 4),
                        CreatedDate = DateTime.Today,
                        PdpQuestionGroup = testLinkset.PdpQuestionGroup.First(f => f.SectionId ==1)
                    },
                    new LinkPdpAnswerView {
                        Answer = "Test answer 1",
                        LinkPdpQuestionId = 5,
                        LinkPdpSetId = 1,
                        Question = listItems.First(e => e.Id == 5),
                        CreatedDate = DateTime.Today.AddMinutes(1),
                        PdpQuestionGroup = testLinkset.PdpQuestionGroup.First(f => f.SectionId ==2)
                    },
                    new LinkPdpAnswerView {
                        Answer = "Test answer 2",
                        LinkPdpQuestionId = 4,
                        LinkPdpSetId = 1,
                        Question = listItems.First(e => e.Id == 4),
                        CreatedDate = DateTime.Today.AddMinutes(1),
                        PdpQuestionGroup = testLinkset.PdpQuestionGroup.First(f => f.SectionId ==2)
                    }
                };
            testLinkset.Answers = Answers;
            return testLinkset;
        }





        public static LinkPdpSetView InsertTestData(LinkPdpSetView linkPdpSet)
        {
            var newPdpSet = AutoMapper.Mapper.Map<LinkPdpSetView, LinkPdpSet>(linkPdpSet);

            using (var db = new RepositoryContext())
            {
                db.LinkPdpSet.Add(newPdpSet);

                db.SaveChanges();
            }

            return AutoMapper.Mapper.Map<LinkPdpSet, LinkPdpSetView>(newPdpSet);
        }

        public PdpService BuildSut()
        {
            setUpMocks();
            return _pdpService;
        }

        public List<ListItemView> GetListItems()
        {
            List<ListItemView> result = new List<ListItemView>();

            using (var db = new RepositoryContext())
            {
                result = AutoMapper.Mapper.Map<List<ListItemView>>(db.ListItems.ToList());
            }

            return result;
        }

        public void AddAnswers(LinkPdpSetView linkPdpSetView)
        {
            var listItems = GetListItems();
           
            
            linkPdpSetView.Answers.AddRange(new List<LinkPdpAnswerView> {
                    new LinkPdpAnswerView {
                        Answer = "Added Test answer 1",
                        LinkPdpQuestionId = 4,
                        LinkPdpSetId = linkPdpSetView.Id,
                        Question = listItems.First(e => e.Id == 4),
                        CreatedDate = DateTime.Today.AddMinutes(10),
                        PdpQuestionGroup = linkPdpSetView.PdpQuestionGroup.First(w => w.SectionId==1)
                        

                    },
                    new LinkPdpAnswerView {
                        Answer = "Added Test answer 2",
                        LinkPdpQuestionId = 5,
                        LinkPdpSetId = linkPdpSetView.Id,
                        Question = listItems.First(e => e.Id == 5),
                        CreatedDate = DateTime.Today.AddMinutes(10),
                         PdpQuestionGroup = linkPdpSetView.PdpQuestionGroup.First(w => w.SectionId==1)
                    },
                    new LinkPdpAnswerView {
                        Answer = "Added Test answer 3",
                        LinkPdpQuestionId = 6,
                        LinkPdpSetId = linkPdpSetView.Id,
                        Question = listItems.First(e => e.Id == 6),
                        CreatedDate = DateTime.Today.AddMinutes(10),
                         PdpQuestionGroup = linkPdpSetView.PdpQuestionGroup.First(w => w.SectionId==1)
                    },
                    new LinkPdpAnswerView {
                        Answer = "Added Test answer 1",
                        LinkPdpQuestionId = 7,
                        LinkPdpSetId = linkPdpSetView.Id,
                        Question = listItems.First(e => e.Id == 7),
                        CreatedDate = DateTime.Today.AddMinutes(10),
                        PdpQuestionGroup = linkPdpSetView.PdpQuestionGroup.First(w => w.SectionId==2)
                    },
                    new LinkPdpAnswerView {
                        Answer = "Added Test answer 2",
                        LinkPdpQuestionId = 8,
                        LinkPdpSetId = linkPdpSetView.Id,
                        Question = listItems.First(e => e.Id == 8),
                        CreatedDate = DateTime.Today.AddMinutes(10),
                        PdpQuestionGroup = linkPdpSetView.PdpQuestionGroup.First(w => w.SectionId==2)
                    },
                    new LinkPdpAnswerView {
                        Answer = "Added Test answer 3",
                        LinkPdpQuestionId = 9,
                        LinkPdpSetId = linkPdpSetView.Id,
                        Question = listItems.First(e => e.Id == 9),
                        CreatedDate = DateTime.Today.AddMinutes(10),
                        PdpQuestionGroup = linkPdpSetView.PdpQuestionGroup.First(w => w.SectionId==2)
                    }
            });
        }

        #region Private methods

        private void setUpMocks()
        {
            _staticServiceMock
                .Setup(x => x.GetOrderedEntities(ListItemEntityTypes.PdpQuestion))
                .Returns(GetListItems().Where(e => e.EntityType == ListItemEntityTypes.PdpQuestion.ToString()).ToList());

            _staticServiceMock
                .Setup(x => x.GetOrderedEntities(ListItemEntityTypes.PdpSection))
                .Returns(GetListItems().Where(e => e.EntityType == ListItemEntityTypes.PdpSection.ToString()).ToList());
        }

        #endregion
    }

    internal class ListItemViewComparer : IComparer
    {
        public int Compare(object x, object y)
        {
            ListItemView a = (ListItemView)x;
            ListItemView b = (ListItemView)y;

            if (a.DisplayOrder > b.DisplayOrder)
                return 1;
            if (a.DisplayOrder < b.DisplayOrder)
                return -1;
            else
                return 0; ;
        }
    }
}
