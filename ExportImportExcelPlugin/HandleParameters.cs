#region Header
// Revit API .NET Labs
//
// Copyright (C) 2007-2019 by Autodesk, Inc.
//
// Permission to use, copy, modify, and distribute this software
// for any purpose and without fee is hereby granted, provided
// that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
//
// Use, duplication, or disclosure by the U.S. Government is subject to
// restrictions set forth in FAR 52.227-19 (Commercial Computer
// Software - Restricted Rights) and DFAR 252.227-7013(c)(1)(ii)
// (Rights in Technical Data and Computer Software), as applicable.
#endregion // Header

#region Namespaces
using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;

using Newtonsoft.Json;

using Autodesk.Revit.ApplicationServices;
using Autodesk.Revit.DB;

using DesignAutomationFramework;

using libxl;

#endregion // Namespaces

namespace ExportImportExcel
{


    [Autodesk.Revit.Attributes.Regeneration(Autodesk.Revit.Attributes.RegenerationOption.Manual)]
    [Autodesk.Revit.Attributes.Transaction(Autodesk.Revit.Attributes.TransactionMode.Manual)]
    public class HandleParamsExcel : IExternalDBApplication
    {
        public const string FireRating = "Fire Rating";
        public const string Comments = "Comments";

        public ExternalDBApplicationResult OnStartup(ControlledApplication app)
        {
            DesignAutomationBridge.DesignAutomationReadyEvent += HandleDesignAutomationReadyEvent;
            return ExternalDBApplicationResult.Succeeded;
        }

        public ExternalDBApplicationResult OnShutdown(ControlledApplication app)
        {
            return ExternalDBApplicationResult.Succeeded;
        }

        public void HandleDesignAutomationReadyEvent(object sender, DesignAutomationReadyEventArgs e)
        {
            e.Succeeded = ProcessParameters(e.DesignAutomationData);
        }

        public static bool ProcessParameters(DesignAutomationData data)
        {
            if (data == null)
                throw new ArgumentNullException(nameof(data));

            Application rvtApp = data.RevitApp;
            if (rvtApp == null)
                throw new InvalidDataException(nameof(rvtApp));

            string modelPath = data.FilePath;
            if (String.IsNullOrWhiteSpace(modelPath))
                throw new InvalidDataException(nameof(modelPath));

            Document doc = data.RevitDoc;
            if (doc == null)
                throw new InvalidOperationException("Could not open document.");

            InputParams inputParams = InputParams.Parse("params.json");

            if (inputParams.Export)
            {
                return ExportToExcel( rvtApp, doc, inputParams.IncludeFireRating, inputParams.IncludeComments );
            }
            else
            {
                return ImportFromExcel(rvtApp, doc, inputParams.IncludeFireRating, inputParams.IncludeComments );
            }
        }


        public static bool ImportFromExcel(Application rvtApp, Document doc, bool includeFireRating, bool includeComments)
        {
            Book book = new BinBook();
            book.load("input.xls");

            if (includeFireRating)
            {
                // 1st sheet is FireRating
                Sheet worksheet = book.getSheet(0);
                if (worksheet == null)
                {
                    throw new FileLoadException("Could not get worksheet.");
                }
                using (Transaction t = new Transaction(doc))
                {
                    t.Start("Import FireRating parameters from Excel");
                    // Starting from row 2, loop the rows and extract params.
                    int id;
                    string fireRatingValue;
                    int row = 2;

                    int count = worksheet.lastRow();
                    Console.WriteLine("Total Row is: " + count);
                    while (row < count)
                    {
                        try
                        {
                            // Extract relevant XLS values.
                            Console.WriteLine("Read the Row: " + row.ToString());

                            id = (int)worksheet.readNum(row, 1);
                            if (0 >= id)
                            {
                                continue;
                            }
                            Console.WriteLine("Read the elemnt Id: " + id.ToString());

                            // Read FireRating value
                            fireRatingValue = worksheet.readStr(row, 5);
                            Console.WriteLine("Read the fire rating value: " + fireRatingValue);

                            // Get document's door element via Id
                            ElementId elementId = new ElementId(id);
                            Element doorType = doc.GetElement(elementId);

                            // Set the param
                            if (null != doorType)
                            {
                                Console.WriteLine("Read the fire rating value of the door: " + doorType.Id.ToString());
                                Parameter fireRatingParam =  doorType.get_Parameter(BuiltInParameter.DOOR_FIRE_RATING);
                                if( null != fireRatingParam)
                                {
                                    if (!fireRatingParam.IsReadOnly)
                                    {
                                        fireRatingParam.Set(fireRatingValue);
                                        Console.WriteLine("write row: " + row.ToString() + " id: " + doorType.Id.IntegerValue.ToString() + " value: " + fireRatingParam.AsString());
                                    }
                                }
                            }
                            Console.WriteLine("Set the parameters of " + elementId.ToString());
                        }
                        catch (System.Exception e)
                        {
                            Console.WriteLine("Get the exception of " + e.Message);
                            break;
                        }
                        ++row;
                    }
                    t.Commit();
                    Console.WriteLine("Commit the FireRating opearation.");
                }

            }
            if (includeComments)
            {
                // 2nd sheet is Comments
                Sheet worksheet = book.getSheet(1);
                if (worksheet == null)
                {
                    throw new FileLoadException("Could not get worksheet.");
                }
                using (Transaction t = new Transaction(doc))
                {
                    t.Start("Import Comments Values from Excel");
                    // Starting from row 2, loop the rows and extract Id and FireRating param.
                    int id;
                    string comments;
                    int row = 2;

                    int count = worksheet.lastRow();
                    Console.WriteLine("Total Row is: " + count);
                    while (row < count)
                    {
                        try
                        {
                            // Extract relevant XLS values.
                            Console.WriteLine("Read the Row: " + row.ToString());
                            id = (int)worksheet.readNum(row, 1);
                            if (0 >= id)
                            {
                                continue;
                            }
                            Console.WriteLine("Read the elemnt Id: " + id.ToString());

                            // Read Door instance comments value
                            comments = worksheet.readStr(row, 4);
                            Console.WriteLine("Read the comments value: " + comments);

                            ElementId elementId = new ElementId(id);
                            Element door = doc.GetElement(elementId);

                            // Set the param
                            if (null != door)
                            {
                                Console.WriteLine("Read the comments value of the door: " + door.Id.ToString());
                                Parameter commentsParam = door.get_Parameter(BuiltInParameter.ALL_MODEL_INSTANCE_COMMENTS);
                                if (null != commentsParam)
                                {
                                    if (!commentsParam.IsReadOnly)
                                    {
                                        commentsParam.Set(comments);
                                        Console.WriteLine("write row: " + row.ToString() + " id: " + door.Id.IntegerValue.ToString() + " value: " + commentsParam.AsString());
                                    }
                                }
                            }
                            Console.WriteLine("Set the parameters of " + elementId.ToString());
                        }
                        catch (System.Exception e)
                        {
                            Console.WriteLine("Get the exception of " + e.Message);
                            break;
                        }
                        ++row;
                    }
                    t.Commit();
                    Console.WriteLine("Commit the Comments opearation.");
                }
            }

            ModelPath path = ModelPathUtils.ConvertUserVisiblePathToModelPath("result.rvt");
            doc.SaveAs(path, new SaveAsOptions());
            Console.WriteLine("Revit File is saved at "+ path.CentralServerPath);
            return true;
        }

        public static bool ExportToExcel( Application rvtApp, Document doc, bool includeFireRating, bool includeComments )
        {
            Console.WriteLine("start create Excel.");
            Book book = new BinBook(); // use XmlBook() for xlsx
            if (null == book)
            {
                throw new InvalidOperationException("Could not create BinBook.");
            }

            if (includeFireRating)
            {
                Sheet sheet = book.addSheet("Door Type FireRating");
                sheet.writeStr(1, 1, "Element ID");
                sheet.writeStr(1, 2, "Unique ID");
                sheet.writeStr(1, 3, "Family Name");
                sheet.writeStr(1, 4, "Family Type");
                sheet.writeStr(1, 5, FireRating);

                List<Element> elems = GetTargetElements(doc, BuiltInCategory.OST_Doors, false);
                // Loop through all elements and export each to an Excel row

                int row = 2;
                foreach (Element e in elems)
                {
                    sheet.writeNum(row, 1, e.Id.IntegerValue);
                    sheet.writeStr(row, 2, e.UniqueId);

                    FamilySymbol symbol = e as FamilySymbol;
                    if( null != symbol)
                    {
                        sheet.writeStr(row, 3, symbol.FamilyName);
                        sheet.writeStr(row, 4, symbol.Name);

                        // FireRating:
                        Parameter fireRatingParam = symbol.get_Parameter(BuiltInParameter.DOOR_FIRE_RATING);
                        if (fireRatingParam != null)
                        {
                            sheet.writeStr(row, 5, fireRatingParam.AsString());
                            Console.WriteLine("write row " + row.ToString() + ":" + e.Id.IntegerValue.ToString() + "," + e.UniqueId + "," + symbol.FamilyName + "," + symbol.Name + "," + fireRatingParam.AsString());
                        }
                    }
                    ++row;
                }
            }

            if ( includeComments)
            {
                Sheet sheet = book.addSheet("Door Instance Comments");
                sheet.writeStr(1, 1, "Element ID");
                sheet.writeStr(1, 2, "Unique ID");
                sheet.writeStr(1, 3, "Instance Name");
                sheet.writeStr(1, 4, Comments);

                Console.WriteLine("write comments");

                List<Element> elems = GetTargetElements(doc, BuiltInCategory.OST_Doors, true);
                // Loop through all elements and export each to an Excel row
                int row = 2;
                foreach (Element e in elems)
                {
                    sheet.writeNum(row, 1, e.Id.IntegerValue);
                    sheet.writeStr(row, 2, e.UniqueId);
                    sheet.writeStr(row, 3, e.Name);

                    // Comments:
                    Parameter commentsParam = e.get_Parameter(
                      BuiltInParameter.ALL_MODEL_INSTANCE_COMMENTS);
                    if (null != commentsParam)
                    {
                        sheet.writeStr(row, 4, commentsParam.AsString());
                        Console.WriteLine("write row " + row.ToString() + ":" + e.Id.IntegerValue.ToString() + "," + e.UniqueId + ","+e.Name + "," + commentsParam.AsString());
                    }
                    ++row;
                }
            }
            book.save("result.xls");
            Console.WriteLine("Excel App is created");
            return true;
        }

        /// <summary>
        /// Helper to get all Elements for a given category,
        /// identified either by a built-in category or by a category name.
        /// </summary>
        public static List<Element> GetTargetElements(
          Document doc,
          object targetCategory,
          bool isInstance)
        {
            List<Element> elements;

            bool isName = targetCategory.GetType().Equals(typeof(string));

            if (isName)
            {
                Category cat = doc.Settings.Categories.get_Item(targetCategory as string);
                FilteredElementCollector collector = new FilteredElementCollector(doc);
                collector.OfCategoryId(cat.Id);
                elements = new List<Element>(collector);
            }
            else
            {
                FilteredElementCollector collector = null;
                if (isInstance)
                {
                    collector = new FilteredElementCollector(doc).WhereElementIsNotElementType();

                }
                else
                {
                    collector = new FilteredElementCollector(doc).WhereElementIsElementType();

                }

                collector.OfCategory((BuiltInCategory)targetCategory);
                elements = collector.ToList<Element>();
            }
            return elements;
        }
    }


    /// <summary>
    /// InputParams is used to parse the input Json parameters
    /// </summary>
    internal class InputParams
    {
        public bool Export { get; set; } = false;
        public bool IncludeFireRating { get; set; } = true;
        public bool IncludeComments { get; set; } = true;
        static public InputParams Parse(string jsonPath)
        {
            try
            {
                if (!File.Exists(jsonPath))
                    return new InputParams { Export = false, IncludeFireRating = true, IncludeComments = true };

                string jsonContents = File.ReadAllText(jsonPath);
                return JsonConvert.DeserializeObject<InputParams>(jsonContents);
            }
            catch (System.Exception ex)
            {
                Console.WriteLine("Exception when parsing json file: " + ex);
                return null;
            }
        }
    }

}
