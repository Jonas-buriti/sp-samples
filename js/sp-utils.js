var SPUtils = {
    parseSearchResults: function (data) {
        var mapCells = function (item) {
            return item.Cells.results.reduce(function (retorno, current, index, array) {
                retorno[index] = current.Key
                current.Value = current.Value || ''
                current.Value = current.Value.replace('string;#', '');
                retorno[current.Key] = current.Value
                return retorno
            }, {})
        }
        return data.d.query.PrimaryQueryResult.RelevantResults.Table.Rows.results.map(mapCells);
    },
    setPeoplePicker: function (fieldTitle, value) {
        $(document).ready(function () {
            $('div[title*="' + fieldTitle + '"][ID*="UserField_upLevelDiv"]').text(value).change()
            $('div[title*="' + fieldTitle + '"] [ID*="UserField_checkNames"]').click()
        })
    },
    getEvents: function (listTitle, year, month) {
        year = year || moment().year()
        month = month || moment().month()

        var soapEnv = this.getMonthQuery(listTitle, year, month);
        var self = this

        return new Promise(function (resolve, reject) {
            $.ajax({
                url: _spPageContextInfo.siteAbsoluteUrl + "/_vti_bin/lists.asmx",
                type: "POST",
                dataType: "xml",
                data: soapEnv,
                complete: function (data) {
                    return resolve(self.parseSpXml(data))
                },
                error: reject,
                contentType: "text/xml; charset=\"utf-8\""
            });
        })


    },
    getMonthQuery: function (listTitle, year, month) {
        return "<soapenv:Envelope\
			    xmlns:soapenv='http://schemas.xmlsoap.org/soap/envelope/'>\
			    <soapenv:Body>\
			        <GetListItems\
			            xmlns='http://schemas.microsoft.com/sharepoint/soap/'>\
			            <listName>"+ listTitle + "</listName>\
			            <query>\
			                <Query>\
			                    <Where>\
			                        <DateRangesOverlap>\
			                            <FieldRef Name='EventDate' />\
			                            <FieldRef Name='EndDate' />\
			                            <FieldRef Name='RecurrenceID' />\
			                            <Value Type='DateTime'>\
			                                <Month />\
			                            </Value>\
			                        </DateRangesOverlap>\
			                    </Where>\
			                    <OrderBy><FieldRef Name='EventDate'/></OrderBy>\
			                </Query>\
			            </query>\
			            <queryOptions>\
			                <QueryOptions>\
			                    <ExpandRecurrence>TRUE</ExpandRecurrence>\
			                    <CalendarDate>"+ moment(year + '-' + month + '-' + 01 + ' 12:00:00').format() + "</CalendarDate>\
			                    <ViewAttributes Scope='RecursiveAll' />\
			                </QueryOptions>\
			            </queryOptions>\
			            <viewFields>\
			                <ViewFields>\
			                    <FieldRef Name='EventDate' />\
			                    <FieldRef Name='EndDate' />\
			                    <FieldRef Name='fAllDayEvent' />\
			                    <FieldRef Name='fRecurrence' />\
			                    <FieldRef Name='Title' />\
			                </ViewFields>\
			            </viewFields>\
			            <RowLimit>5000</RowLimit>\
			        </GetListItems>\
			    </soapenv:Body>\
			</soapenv:Envelope>"
    },
    parseSpXml: function (data) {
        return $(data.responseXML).find('z\\:row').get().map(function (node) {
            var jsonObj = {}

            $.each(node.attributes, function (i, attr) {
                if (attr.specified) {
                    jsonObj[attr.name.replace('ows_', '')] = attr.value;
                }
            });
            return jsonObj
        })
    },
	terminateWorkflow(listId, itemId, stepName) {
		// you should load SP.js, SP.Runtime.js and SP.workflowservices.js in your page / master
		var context = SP.ClientContext.get_current();
		var workflowServicesManager = SP.WorkflowServices.WorkflowServicesManager.newObject(context, context.get_web());
		var workflowInstanceService = workflowServicesManager.getWorkflowInstanceService();
		var wfInstances = workflowInstanceService.enumerateInstancesForListItem(listId, itemId);
		context.load(wfInstances);
		return new Promise(function (resolveMain, rejectMain) {
			context.executeQueryAsync(
				function (sender, args) {
					var instancesEnum = wfInstances.getEnumerator();
					var calls = [];

					while (instancesEnum.moveNext()) {
						var instance = instancesEnum.get_current();
						var step = instance.get_objectData().get_properties().UserStatus || '';
						if (step.toLowerCase() == stepName.toLowerCase()) {
							workflowInstanceService.terminateWorkflow(instance);

							var call = new Promise(function (resolveChild, rejectChild) {
								context.executeQueryAsync(
									function (sender, args) {
										return resolveChild()
									},
									function (sender, args) {
										console.log("Failed to terminate workflow.");
										rejectChild("Error: " + args.get_message() + "\n" + args.get_stackTrace());
									}
								);
							});
							calls.push(call)
						}

						return Promise.all(calls)
							.then(resolveMain)
					}

					return response;
				},
				function (sender, args) {
					console.log("Failed to load instances.");
					rejectMain("Error: " + args.get_message() + "\n" + args.get_stackTrace());
				}
			);
		});

	},
}
