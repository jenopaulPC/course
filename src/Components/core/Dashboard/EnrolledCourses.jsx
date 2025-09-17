import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getUserCourses as getUserEnrolledCourses } from "../../../services/operations/profileAPI";
import ProgressBar from "@ramonak/react-progress-bar";
import { useNavigate } from "react-router";
import axios from "axios";

const EnrolledCourses = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);
  const [enrolledCourses, setEnrolledCourses] = useState(undefined);
  const [progressData, setProgressData] = useState(undefined);
  const [Loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // fetch courses
  const getEnrolledCourses = async () => {
    setLoading(true);
    const response = await getUserEnrolledCourses(token, dispatch);

    console.log("getEnrolledCourses -> response", response);
    setLoading(false);
    setEnrolledCourses(response?.courses);
    setProgressData(response?.courseProgress);
  };
  const totalNoOfLectures = (course) => {
    let total = 0;
    course.courseContent.forEach((section) => {
      total += section.subSection.length;
    });
    return total;
  };
  const handleDownloadCertificate = async (course, progress) => {
    try {
      const certifiedDate = new Date(new Date(progress?.updatedAt).getTime() + 5.5*60*60*1000)
        .toISOString()
        .split("T")[0];

      const certifiedId = `CERT-${user?._id.slice(-2)}-${course?._id.slice(-2)}-${certifiedDate.replace(/-/g, "")}`;

      const payload = {
        studentName: `${user?.firstName} ${user?.lastName}`,
        courseName: course.courseName,
        instructor: `${course?.instructor?.firstName} ${course?.instructor?.lastName}` || "Instructor",
        certifiedOn: certifiedDate,
        certifiedId,
      };

      const response = await axios.post(
        "http://localhost:5000/api/v1/course/downloadCertificate",
        payload,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${course.courseName}_Certificate.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Certificate download failed:", error);
    }
  };

  useEffect(() => {
    getEnrolledCourses();
  }, []);

  if (Loading) {
    return (
      <div className="flex h-[calc(100vh)] w-full justify-center items-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-richblack-500"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-11/12 max-w-[1000px] py-10">
      <div className="text-3xl text-richblack-50">Enrolled Courses</div>
      {!enrolledCourses ? (
        <div>Loading...</div>
      ) : !enrolledCourses.length ? (
        <p className="grid h-[10vh] w-full place-content-center text-richblack-5">
          You have not enrolled in any course yet
        </p>
      ) : (
        <div className="my-8 text-richblack-5">
          {/* Table Header */}
          <div className="flex rounded-t-lg bg-richblack-500">
            <p className="w-[45%] px-5 py-3">Course Name</p>
            <p className="w-1/4 px-2 py-3"></p>
            <p className="flex-1 px-2 py-3">Progress</p>
            <p className="w-1/5 px-2 py-3 text-center">Certificate</p>
          </div>

          {/* Course Rows */}
          {enrolledCourses.map((course, index) => {
            // find progress for this course
            const progress = progressData?.find(
              (p) => p?.courseID?.toString() === course?._id?.toString()
            );

            const totalLectures = totalNoOfLectures(course);
            const completedLectures = progress?.completedVideos?.length || 0;
            const isCompleted = completedLectures === totalLectures;

            return (
              <div
                key={index}
                onClick={() => {
                  navigate(
                    `view-course/${course._id}/section/${course.courseContent[0]._id}/sub-section/${course.courseContent[0].subSection[0]}`
                  );
                }}
                className="flex items-center border border-richblack-700 rounded-none"
              >
                {/* Course Details */}
                <div className="flex w-[45%] cursor-pointer items-center gap-4 px-5 py-3">
                  <img
                    className="h-14 w-14 rounded-lg object-cover"
                    src={course.thumbnail}
                    alt={course.courseName}
                  />
                  <div className="flex max-w-xs flex-col gap-2">
                    <p className="font-semibold">{course.courseName}</p>
                    <p className="text-xs text-richblack-300 hidden md:block">
                      {course.courseDescription.length > 50
                        ? course.courseDescription.slice(0, 50) + "...."
                        : course.courseDescription}
                    </p>
                  </div>
                </div>

                {/* Duration */}
                <div className="w-1/4 px-2 py-3">{course?.totalDuration}</div>

                {/* Progress */}
                <div className="flex w-1/5 flex-col gap-2 px-2 py-3">
                  <p>
                    Completed: {completedLectures} / {totalLectures}
                  </p>
                  <ProgressBar
                    completed={(completedLectures / totalLectures) * 100}
                    height="8px"
                    isLabelVisible={false}
                  />
                </div>

                {/* Certificate */}
                <div className="w-1/5 flex justify-center items-center px-2 py-3">
                  {isCompleted ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadCertificate(course, progress);
                      }}
                      className="px-3 py-1 text-sm bg-blue-50 text-black rounded-lg hover:bg-blue-100"
                    >
                      Download
                    </button>
                  ) : (
                    <span className="text-xs text-richblack-300">
                      Not Available
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EnrolledCourses;
